import idb from "idb";

// ================ OPEN DATABASE ===================

const dbPromise = idb.open("rest_reviews_db", 2, upgradeDb => {
  switch(upgradeDb.oldVersion) {
    // Note: don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    case 0:
        // executes when the database is first created
        //createObectstore (method) returns a promise for the database,
        //containing objectStore 'restaurants' which uses id as its key
          const store = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    case 1:
        //createObectstore (method) returns a promise for the database,
        //containing objectStore 'reviews' which uses id as its key
          const storeReviews = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
                storeReviews.createIndex("restaurant", "restaurant_id");
                //storeReviews.createIndex("restaurant_id", "restaurant_id");
    /*case 2:
      const pending = upgradeDB.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
      });*/
  }
});

export default dbPromise;