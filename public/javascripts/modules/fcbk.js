window.fbAsyncInit = function() {
  FB.init({
    appId: '2009881892603867',
    autoLogAppEvents: true,
    xfbml: true,
    version: 'v2.12',
  });
};

(function(d, s, id) {
  let js,
    fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = 'https://connect.facebook.net/en_US/sdk.js';
  fjs.parentNode.insertBefore(js, fjs);
})(document, 'script', 'facebook-jssdk');
