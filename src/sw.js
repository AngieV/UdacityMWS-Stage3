import idb from "idb";
import dbPromise from "./js/dbPromise";

let cacheID = "mws_rrdb" + "-v 1.3";

let urlsToCache = [ '/',
                   '/index.html',
                   '/restaurant.html',
                   '/css/styles.css',
                   '/js/main.js',
                   '/js/restaurant_info.js',
                   '/manifest.json'
                 ];

// ================== INSTALL SERVICEWORKER =====================

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheID).then(cache => {
      console.log(`Opened ${cacheID} cache`);
        return cache.addAll(urlsToCache)
    .catch(error => {
      console.log("Caches open failed: " + error);
    });
  }));
});

// ==================== LISTEN FOR REQUEST =======================

self.addEventListener('fetch', event => {
  let requestCache = event.request;
  let cacheUrl = new URL(event.request.url);
  if (event.request.url.indexOf("restaurant.html") >= 0) {
    const RestaurantCacheURL = "restaurant.html";
    requestCache = new Request(RestaurantCacheURL);
  }
    // ======= SEPARATE AJAX from CACHE REQUESTS ========  
    // Requests to the API are handled separately from others
    // 10 lines by ~ Doug Brown
  const checkURL = new URL(event.request.url);
  if(checkURL.port == 1337) { // === "1337"  ??
      const parts = checkURL.pathname.split("/");
      let id = checkURL.searchParams.get("restaurant_id") - 0;
      if(!id) {
        if (checkURL.pathname.indexOf("restaurants")) {
          id = parts[parts.length - 1] === "restaurants" ? "-1": parts[parts.length - 1];
        } else {
          id = checkURL.searchParams.get("restaurant_id");
        }
      }
      readDatabase_AJAX(event, id);
    } else {
      handleRequest(event, requestCache);
    }
  });

//=========== HANDLE AJAX RESTAUARANT & REVIEW REQUESTS ===========
  const readDatabase_AJAX = (event, id) => {
    // Only use caching for GET events
    if (event.request.method !== "GET") {
      return fetch(event.request)
        .then(fetchResponse => fetchResponse.json())
        .then(json => {
          return json;
        });
    }
    // === DIRECT AJAX RESTAUARANT & REVIEW REQUESTS ===
    // Split requests for handling restaurants & reviews
  //if(request.url.includes("reviews")
    if(event.request.url.indexOf("reviews") > -1) {
      handleReviewsEvent(event, id);
    } else {
      handleRestaurantEvent(event, id);
    }
  }

// ===================== HANDLE REVIEWS =======================
//code by Doug Brown
const handleReviewsEvent = (event, id) => {
  if (event.Request.method === "POST" || event.Request.method === "PUT") {
    return fetch(event.request);
  };
  
  event.respondWith(dbPromise.then(db => {
    return db
      .transaction("reviews")
      .objectStore("reviews")
      .index("restaurant_id")
      .getAll(id);
  }).then(data => {
    return (data.length && data) || fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(data => {
        return dbPromise.then(idb => {
          const itx = idb.transaction("reviews", "readwrite");
          const store = itx.objectStore("reviews");
          data.forEach(review => {
            store.put({id: review.id, "restaurant_id": review["restaurant_id"], data: review});
          })
          return data;
        })
      })
  }).then(finalResponse => {
    if (finalResponse[0].data) {
      // Need to transform the data to the proper format
      const mapResponse = finalResponse.map(review => review.data);
      return new Response(JSON.stringify(mapResponse));
    }
    return new Response(JSON.stringify(finalResponse));
  }).catch(error => {
    return new Response("Error fetching data", {status: 500})
  }))
}

// ===================== HANDLE RESTAURANTS =======================

  const handleRestaurantEvent = (event, id) => {
    // Check IndexedDB for JSON, return if available; 
    event.respondWith(dbPromise.then(db => {
      console.log("sw got dbPromise-restaurants");
      //create a transaction and pass objectStore(s)
      let tx = db.transaction("restaurants");
      // call objectStore and pass the name of the objectStore
      let store = tx.objectStore("restaurants");
      return store.get(id); //('id')?
    }).then(data => {
      //next 3 lines ~ by Doug Brown ~
        return (data && data.data) || fetch(event.request)
          .then(fetchResponse => fetchResponse.json())
          .then(json => {
            console.log("sw got restaurants json");
            //save the JSON data to the IDB
            return dbPromise.then(db => {
              const tx = db.transaction("restaurants", "readwrite");
              const store = tx.objectStore('restaurants').put({
                id: id,
                data: json
              });
              console.log("sw put restaurant data in db: ", json);
              return json;
            }); // dbPromise.then(db => {
          }); // .then(json => {
            // next 6 lines by Doug Brown
      }).then(finalresponse => {
        return new Response (JSON.stringify(finalResponse));
      })
      .catch(error => {
        return new Response("Error fetching data: ", { status: 500 });
      })); //fulfill Promise : event.respondWith(dbPromise.then(db => {
  }; // end

// ===================== HANDLE CACHE REQUESTS =======================
    function handleRequest(event, requestCache) {
    // Check for previously cached html-if available, return;
    // If not available, fetch, cache & return the request
    event.respondWith(
      caches.match(requestCache).then(response => { 
        if (response) {
          return response;
        } else {
          // IMPORTANT: Clone the request. A request is a stream and
          // can only be consumed once. Since we are consuming this
          // once by cache and once by the browser for fetch, we need
          // to clone the response.
          console.log("doing fetch since not in cache");
          const fetchRequest = event.request.clone();
          return fetch(fetchRequest).then(fetchResponse => {
            //Check if we received a valid response
            if(!fetchResponse || fetchResponse.status !== 200) {
              return new Response("No internet connection", { 
                status: 404, 
                statusText: "No internet connection"
              });
            } else {
              return caches.open(cacheID).then(cache => {
                if (fetchResponse.url.indexOf("restaurants.html") === -1) {
                  // IMPORTANT: Clone the response
                  const cacheResponse = fetchResponse.clone()
                  cache.put(event.request, cacheResponse);
              }
              return fetchResponse;
            });
            }
          }).catch(error => {
            // handle lack of jpg
            if (event.request.url.indexOf(".jpg") >= 0) {
                return caches.match("/img/na.png");
              } else {
                return new Response("Item not found", {
                status: 404,
                statusText: error
                });
              }
            }) //end catch
        }  //end else
      })); //end respond with...
    } //end handleReq