import * as functions from 'firebase-functions'
import * as geolib from 'geolib';

const admin = require('firebase-admin');
admin.initializeApp();

// When a user's Status changes, start or stop their clock and log a timesheet entry.
export const onStatusUpdate = functions.database.ref('/users/{uid}/Status/')
  .onUpdate((change, context) => {
    const after = change.after.val();
    console.log(after);
    const dateToday = new Date();
    const currentDate = new Date(Date.now()).toLocaleString();
    const timeedit = Date.now();

    if (after == "Present") {
      return change.after.ref.parent?.child("clock").update({
        "startTime": timeedit,
        "punchIn": currentDate
      });
    }
    else {
      return change.after.ref.parent?.child("clock").update({ "endTime": timeedit })
        .then(function () {
          change.after.ref.parent?.child("clock").once('value')
            .then(function (snapshot: any) {
              const temp = snapshot.val();
              const pTime = temp.punchIn;
              console.log(pTime);
              const totalHour = (temp.endTime - temp.startTime) / 3600000;
              change.after.ref.parent?.child("Timesheet").push({
                "Date": dateToday.toISOString().slice(0, 10),
                "Clockin": pTime,
                "Clockout": currentDate,
                "Hours": totalHour
              });
            });
        });
    }
  });

// When a user's Location changes, mark them Present if they are inside the Head Office polygon, otherwise Away.
export const onMessageUpdate = functions.database.ref('/users/{uid}/Location/')
  .onUpdate((change, context) => {
    const after = change.after.val();
    console.log(after.lat);
    console.log(after.lng);
    const newlat = after.lat;
    const newlng = after.lng;
    console.log(newlng + newlat);

    return admin.database().ref().child("Polygon Coordinates").child("Head Office").once('value')
      .then(function (snapshot: any) {
        console.log(snapshot.val());
        const coords = snapshot.val();
        if (geolib.isPointInPolygon({ latitude: newlat, longitude: newlng }, coords)) {
          return change.after.ref.parent?.update({ "Status": "Present" });
        }
        else
          return change.after.ref.parent?.update({ "Status": "Away" });
      });
  });

// Look up a user's uid from their email address.
export const getUserbyMail = functions.https.onCall((data, context) => {
  console.log(data.Email);
  return admin.auth().getUserByEmail(data.Email)
    .then(function (userRecord: any) {
      return userRecord.uid;
    });
});

// Save employee details under an existing user's info node.
// TODO: check that the caller is an admin before writing.
export const addAdminId = functions.https.onCall((data, context) => {
  const id = data.Uid;
  return admin.database().ref("/users/" + id + "/info").set({
    "Name": data.name,
    "EmployeeId": data.Empid,
    "Email": data.Email,
    "JobTitle": data.Role,
  });
});

// Create a new login account and its employee info. Called from public/admin/addEmp.html.
// TODO: check that the caller is an admin before creating accounts.
export const createID = functions.https.onCall((data, context) => {
  return admin.auth().createUser({
    email: data.email,
    emailVerified: false,
    password: data.password,
    displayName: data.name,
  }).then((userRecord: any) => {
    const id = userRecord.uid;
    return admin.database().ref("/users/" + id + "/info/").set({
      "Name": data.name,
      "EmployeeId": data.Empid,
      "Email": data.email,
      "JobTitle": data.Role,
    });
  });
});
