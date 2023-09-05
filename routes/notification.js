// const {_app} =require('../firebaseInit');

// exports.sendFCM=async(amt,user) => {
//     try {
//         const message = {
//             notification: {
//                 title: amt.toString()+" challenge set by "+user,
//                 body: `A new challenge of ${amt.toString()} has been set by ${user}`
//             },
//             topic: "ludo"
//         };

//         return await _app.messaging().send(message);
//     } catch (error) {
//         return error
//     }
// }
