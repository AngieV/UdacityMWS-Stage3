import DBHelper from "./dbhelper";
import './register';


//set text for faved, set button style
  function getTitle(restaurant) {
    let title;
    if (restaurant.is_favorite == 'true' || ('aria-pressed') == 'true'){
      title = ` ${restaurant.name} is a favorite! (Click to remove)`;
    } else {
      title =` Click to Favorite`;
    }
    return title;
  }

// ~ following code by Alexandro Perez with modifications on button object

  function handleClick() {
    const restaurantId = this.dataset.id;
    const fav = this.getAttribute('aria-pressed') == 'true';
    const url = `${DBHelper.DATABASE_URL}/restaurant/?is_favorite=${!fav}`;
    const PUT = {method: 'PUT'};

    //this.onclick = null;
    console.log( `Preparing to update idb: is_favorite to update is favorite for restaurant`);

    DBHelper.handleFavoriteClick(restaurantId, !fav)
    // change state of toggle button
    this.setAttribute('aria-pressed', !fav);
  }

export default function favoriteButton(restaurant) {
  const button = document.createElement('button');
  button.innerHTML = "&#x2764;"; // this is the heart symbol in hex code
  button.classList.add("fav"); // you can use this class name to style your button
  button.dataset.id = restaurant.id; // store restaurant id in dataset for later
  button.setAttribute('aria-label', `Mark ${restaurant.name} as a favorite`);
  button.setAttribute('aria-pressed', restaurant.is_favorite);
  button.title = getTitle(restaurant);
  button.name = restaurant.name;
  button.onclick = handleClick;
  return button;
}