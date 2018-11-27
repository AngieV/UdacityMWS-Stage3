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

  function handleClick() {
/*  const restaurantId = this.dataset.id;
  const fav = this.getAttribute('aria-pressed') == 'true';
  const url = `${DBHelper.API_URL}/restaurants/${restaurantId}/?is_favorite=${!fav}`;
  const PUT = {method: 'PUT'};

  // TODO: use Background Sync to sync data with API server
  return fetch(url, PUT).then(response => {
    if (!response.ok) 
      return Promise.reject("We couldn't mark restaurant as favorite.");
    return response.json();
  }).then(updatedRestaurant => {
    // update restaurant on idb
    DBHelper.updateFavorite(updatedRestaurant, true);
  });
}*/
    //const fav = this.getAttribute('aria-pressed') == 'true';
    let fav = this.getAttribute('aria-pressed') == 'true';
    let toggledBtn= getElementById("favBtn");
    if(fav) {
      toggledBtn.classList.toggle(".fav");
      toggledBtn.title = ` ${restaurant.name} is a favorite!`
    } else {
      toggledBtn.classList.toggle(".fav[aria-pressed=true]");
      toggledBtn.title = ` Click to Favorite`;
    } 
  }


  // ~ following code by Alexandro Perez
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