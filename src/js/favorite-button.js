import DBHelper from "./dbhelper";
import './register';


//set text for faved, set button style
  function getTitle(restaurant) {
    let title;
    if (restaurant.is_favorite == 'true' || ('aria-pressed') == 'true'){
      title = ` ${restaurant.name} is a favorite!`;
    } else {
      title =` Click to Favorite`;
    }
    return title;
  }

// ~ following code by Alexandro Perez

  function handleClick() {
  const restaurant_id = this.dataset.id;
  const fav = this.getAttribute('aria-pressed') == 'true';
  const url = `${DBHelper.DATABASE_URL}/restaurant/?is_favorite=${!fav}`;
  const PUT = {method: 'PUT'};

  this.onclick = null;
  console.log( `Preparing to update idb: is_favorite for ${restaurant}`);

  // use Background Sync to sync data with API server ??
  // Update the idb
  return fetch(url, PUT).then(response => {
    if (!response.ok) 
      return Promise.reject("Couldn't change favorite status.");
    return response.json();
  }).then(updatedRestaurant => {
    // update restaurant on idb
   DBHelper.updateFavorite(updatedRestaurant, !fav);
  });
}

export default function favoriteButton(restaurant) {
  const button = document.createElement('button');
  button.innerHTML = "&#x2764;"; // this is the heart symbol in hex code
  button.classList.add("fav"); // you can use this class name to style your button
  button.dataset.id = restaurant.restaurant_id; // store restaurant id in dataset for later
  button.setAttribute('aria-label', `Mark ${restaurant.name} as a favorite`);
  button.setAttribute('aria-pressed', restaurant.is_favorite);
  button.title = getTitle(restaurant);
  //button.onclick = handleClick;
  return button;
}