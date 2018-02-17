function autocomplete(input, latInput, lngInput) {
  if (!input) return; // simple way to skip this if no input on the page
  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener('place_changed', () => { // google maps way to addEventListener
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
    // console.log(place);
  });

  // if a user hits enter on the address field, don't submit the form yet
  input.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  });
}

export default autocomplete;
