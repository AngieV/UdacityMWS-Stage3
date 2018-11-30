import idb from "idb";
import dbPromise from "./dbPromise";

let fetchedNeighborhoods;
let fetchedCuisines;

/**
 * Common database helper functions.
 */
export default class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`; //`http://localhost:${port}/data/restaurants.json`
  }

  /**
   * API URL
   */
  static get API_URL() {
    const port = 1337; // port where sails server will listen.
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}`)
    .then(response => {
      response.json()
    .then(restaurants => {
      console.log('restaurants.JSON: ', restaurants);
      if (restaurants.length) {
            // Get all neighborhoods from all restaurants
            const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
            // Remove duplicates from neighborhoods
            fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

            // Get all cuisines from all restaurants
            const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
            // Remove duplicates from cuisines
            fetchedCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
          }
        callback(null, restaurants);
      });
  }).catch(error => { // Oops!. Got an error from server.
      if (response.status != 200) {
        callback (`Request failed. Returned status of ${error.status}.`, null);
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  static fetchReviewsByRestaurantId(id, callback){
    fetch(`${DBHelper.API_URL}/reviews/?restaurant_id=${id}`, {method: "GET"})
    .then(response => {
      if (!response.clone().ok && !response.clone().redirected)
        throw "No reviews available";
      response.json().then(data => {
        callback(null, data);
      })
    })
    .catch(error =>
      callback(error, null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type === cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    if (fetchedNeighborhoods) {
      callback(null, fetchedNeighborhoods);
      return;
    }

    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    if (fetchedCuisines) {
      callback(null, fetchedCuisines);
      return;
    }

    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const fetchedCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, fetchedCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph && !restaurant.id)
      restaurant.photograph = "na.png";
    return (`/img/${restaurant.photograph||restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(map);
    return marker;
  }


 // most of remaining dbhelper code by Doug Brown from walkthrough

  static handleFavoriteClick(id, newState) {
    // Block any more clicks on this until the callback
    //const fav = document.getElementById("favorite" + id);
    //this.onclick = null;
    console.log( `Preparing to update idb: ${newState} for ${id}`);

    DBHelper.updateFavorite(id, newState, (error, resultObj) => {
      if (error) {
        console.log("Error updating favorite");
        return;
      }
    });
  }

  static updateFavorite(id, newState, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.DATABASE_URL}/${id}/?is_favorite=${newState}`;
    const PUT = {method: 'PUT'};
    // // Only use caching for GET events
    DBHelper.updateCachedRestaurantData(id, {"is_favorite": newState});
    DBHelper.addPendingRequestToQueue(url, PUT);

    // Update the favorite data in restaurant cache
    callback(null, {id, value: newState});
  }

  static updateCachedRestaurantData(id, updateObj) {
    // Update data for all restaurants first
    dbPromise.then(db => {
      console.log( `Preparing to update ${updateObj} for ${id}`);
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx.objectStore("restaurants").get("-1").then(value => {
          if (!value) {
            console.log("No cached restaurant data found");
            return;
          }
          const data = value.data;
          const restaurantArr = data.filter(r => r.id === id);
          const restaurantObj = restaurantArr[0];
          // Update restaurantObj with updateObj details
          if (!restaurantObj){
            console.log(`unable to update restaurant w/${updateObj} details `);
            return;
          }
            
          const keys = Object.keys(updateObj);
          keys.forEach(k => {
            restaurantObj[k] = updateObj[k];
          })

          // Put the data back in IDB storage
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx.objectStore("restaurants")
              .put({id: "-1", data: data});
              console.log(`updated ${updateObj} data in idb`)
            return tx.complete;
          })
        })
    })

    // Update the restaurant specific data
    dbPromise.then(db => {
      console.log("Getting db transaction");
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx.objectStore("restaurants").get(id + "")
        .then(value => {
          if (!value) {
            console.log("No cached specific data found");
            return;
          }
          const restaurantObj = value.data;
          console.log("Specific restaurant obj: ", restaurantObj);
          // Update restaurantObj with updateObj details
          if (!restaurantObj)
            return;
          const keys = Object.keys(updateObj);
          keys.forEach(k => {
            restaurantObj[k] = updateObj[k];
          })

          // Put the data back in IDB storage
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx.objectStore("restaurants")
              .put({
                id: id + "",
                data: restaurantObj
              });
              console.log(`Updated ${id} ${updateObj} in idb`)
            return tx.complete;
          })
        })
    })
  }

  /*static saveReview(id, review, callback) {
    // Block any more clicks on the submit button until the callback
    const btn = document.getElementById("addReview");
    btn.onclick = null;

    // Create the POST body
    const body = {
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comments,
      createdAt: Date.now()
    }

    DBHelper.saveNewReview(id, body, (error, result) => {
      if (error) {
        callback(error, null);
        return;
      }
      callback(null, result);
    })
  }*/
  /*static putReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.API_URL}/reviews/` + id;
    const PUT = {method: 'PUT'};
    fetch(url, PUT);
  }

  static saveNewReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.API_URL}/reviews/` + id;
    const method = "POST";
    console.log(`Adding ${bodyObj} to IDB queue`) 
    DBHelper.updateCachedRestaurantReview(id, bodyObj);
    DBHelper.addPendingRequestToQueue(url, method, bodyObj);
    callback(null, null);
  } */

  static updateCachedRestaurantReview(id, bodyObj) {
    console.log("updating cache for new review: ", bodyObj);
    // Push the review into the reviews store
    dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");
      console.log("putting cached review into store");
      store.put({
        id: Date.now(),
        "restaurant_id": id,
        data: bodyObj
      });
      console.log("successfully put cached review into store");
      return tx.complete;
    })
  }

  static addPendingRequestToQueue(url, method, body) {
    // Open the database and add the request details to the pending table
    //const dbPromise = idb.open("rest_reviews_db");
    dbPromise.then(db => {
      const tx = db.transaction("pending", "readwrite");
      tx.objectStore("pending")
        .put({
          data: {
            url,
            method,
            body
          }
        })
    })
      .catch(error => {})
      .then(DBHelper.nextPending());
  }

  static nextPending() {
    DBHelper.attemptCommitPending(DBHelper.nextPending);
  }

  static attemptCommitPending(callback) {
    // Iterate over the pending items until there is a network failure
    let url;
    let method;
    let body;
    //const dbPromise = idb.open("fm-udacity-restaurant");
    dbPromise.then(db => {
      if (!db.objectStoreNames.length) {
        console.log("DB not available");
        db.close();
        return;
      }

      const tx = db.transaction("pending", "readwrite");
      tx.objectStore("pending")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return;
          }
          const value = cursor.value;
          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = cursor.value.data.body;

          // If we don't have a parameter then we're on a bad record that should be tossed
          // and then move on
          if ((!url || !method) || (method === "POST" && !body)) {
            cursor.delete().then(callback());
            return;
          };

          const properties = {
            body: JSON.stringify(body),
            method: method
          }
          console.log("sending post from queue: ", properties);
          fetch(url, properties)
            .then(response => {
            // If we don't get a good response then assume we're offline
            if (!response.ok && !response.redirected) {
              return;
            }
          })
            .then(() => {
              // Success! Delete the item from the pending queue
              const deltx = db.transaction("pending", "readwrite");
              deltx
                .objectStore("pending")
                .openCursor()
                .then(cursor => {
                  cursor
                    .delete()
                    .then(() => {
                      callback();
                    })
                })
              console.log("deleted pending item from queue");
            })
        })
        .catch(error => {
          console.log("Error reading cursor");
          return;
        })
    })
  }

}
