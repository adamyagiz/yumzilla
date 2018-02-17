import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
  return stores.map(store => `<a href="/store/${store.slug}" class="search__result"><store>${store.name}</store></a>`)
    .join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    // if there is no value, quit it!
    if (!this.value) {
      searchResults.style.display = 'none';
      return; // stop!
    }

    // show search results
    searchResults.style.display = 'block';
    searchResults.innerHTML = '';

    axios
      .get(`/api/v1/search/${this.value}`)
      .then((res) => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
        } else {
          // tell them nothing came back
          searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for <strong>${this.value}</strong> found.</div>`);
        }
      })
      .catch(err => console.error(err));
  });

  searchInput.on('keyup', (e) => {
    // if the key press is not up, down, or enter, ignore it!
    // 40 = down
    // 38 = up
    // 13 = return/enter
    if (![40, 38, 13].includes(e.keyCode)) return; // skip out

    // otherwise, do something...
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;

    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }

    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
