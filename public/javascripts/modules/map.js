import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: 37.84, lng: -122.25 },
  zoom: 13,
};

function loadPlaces(map, lat = 37.84, lng = -122.25) {
  axios.get(`/api/v1/stores/near/${lat}/${lng}`).then(res => {
    const places = res.data;
    if (!places.length) {
      alert('no places');
      return;
    }

    // create a bounds to ensure stores within our bounds can be seen
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map(place => {
      const [placeLng, placeLat] = place.location.coordinates;
      const position = { lat: placeLat, lng: placeLng };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map,
        position,
        title: place.name,
        animation: google.maps.Animation.DROP,
      });
      marker.place = place;
      return marker;
    });

    // when a marker is clicked, show the details of that place
    markers.forEach(marker =>
      marker.addListener('click', function() {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} <address>${this.place.location.address}</address></p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      })
    );

    // then zoom the map to fit all markers
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;

  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;
