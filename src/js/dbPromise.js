import idb from "idb";

// ================ OPEN DATABASE ===================

const dbPromise = idb.open("rest_reviews_db", 3, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    // Note: don't use 'break' in this switch statement, fall-through behaviour is what we want.
    case 0:
    // executes when the DB is first created; returns a promise for the db containing objectStore 'restaurants'
      upgradeDB.createObjectStore("restaurants", {keyPath: "id"});
    case 1:
      //returns a promise for the database, containing objectStore 'reviews'
        const reviewsStore = upgradeDB.createObjectStore("reviews", {keyPath: "id"});
        reviewsStore.createIndex("restaurant_id", "restaurant_id");
    case 2:
      upgradeDB.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
      });
  }
});

export default dbPromise;

/*  case 0:
        const store = upgradeDB.createObjectStore("restaurants", {keyPath: "id"});
    case 1:
        const storeReviews = upgradeDB.createObjectStore("reviews", {keyPath: "id"});
        storeReviews.createIndex("restaurant_id", "restaurant_id");
*/