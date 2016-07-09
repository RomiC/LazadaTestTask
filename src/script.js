require('promise-polyfill');
require('whatwg-fetch');
require('classlist-polyfill');

/**
 * Form element
 * @type {HTMLElement}
 */
var compareForm;

/**
 * Input element for the first good url
 * @type {HTMLElement}
 */
var good1;

/**
 * Input element for the second good url
 * @type {HTMLElement}
 */
var good2;

/**
 * Submit button in compare form
 * @type {HTMLElement}
 */
var submit;

/**
 * Block for display error
 * @type {HTMLElement}
 */
var error;

/**
 * Progress-bar block
 * @type {HTMLElement}
 */
var progress;

/**
 * Compare list
 * @type {HTMLElement}
 */
var compareList;

/**
 * Compare list
 * @type {HTMLElement}
 */
var compareList;

/**
 * Load and parse good data
 */
var loadGood = function(url) {
  return fetch('https://crossorigin.me/' + url)
    .then(function(res) {
      return res.text();
    })
    .then(function(text) {
      return text.replace(/([\r\n]|\s{2,})/ig, '');
    })
    .then(function(text) {
      // We may use more common regex, such as this:
      // <(\S+)(\s[^>]+)?\sclass="specification-table"([^>]+)?>((?!<\/\1).)*<\/\1>
      return /<table class="specification-table"[^>]?>((?!<\/table).)*<\/table>/.exec(text);
    })
    .then(function(res) {
      var d = document.createElement('div');
      d.innerHTML = res[0];

      var props = Array.prototype.reduce.call(d.getElementsByTagName('tr'), function(res, tr) {
        var tds = tr.getElementsByTagName('td');
        res[tds[0].innerText] = tds[1].innerText;
        return res;
      }, {});

      var nameRegex = /<h1[^>]*>([^<]+)<\/h1>/.exec(res.input);
      props.__name = nameRegex[1];

      var imageRegex = /data-swap-image="([^"]+)"/.exec(res.input)
      props.__image = imageRegex[1];

      return props;
    });
};

/**
 * Before compare start callback
 */
var beforeCompare = function() {
  good1.setAttribute('disabled', 'disabled');
  good2.setAttribute('disabled', 'disabled');
  submit.setAttribute('disabled', 'disabled');

  progress.classList.add('compare-progress--visible');
  error.classList.remove('compare-error--visible');

  compareList.innerHTML = '';

  return true;
};

/**
 * After compare finished callback
 */
var afterCompare = function() {
  good1.removeAttribute('disabled');
  good2.removeAttribute('disabled');
  submit.removeAttribute('disabled');

  progress.classList.remove('compare-progress--visible');

  return true;
};

/**
 * Compare function
 */
var compare = function(e) {
  e.preventDefault();
  Promise.resolve()
    .then(beforeCompare)
    .then(function() {
      if (!good1.value) {
        throw new Error('Good 1 is empty!');
      }

      if (!good2.value) {
        throw new Error('Good 2 is empty!');
      }

      return true;
    })
    .then(function() {
      return Promise.all([
        loadGood(good1.value),
        loadGood(good2.value)
      ]);
    })
    .then(function(goods) {
      var good1Props = goods[0];
      var good2Props = goods[1];

      var propsList = Object.create(null);

      for (var name in good1Props) {
        if (good1Props.hasOwnProperty(name)) {
          propsList[name] = true;
        }
      }

      for (var name in good2Props) {
        if (good2Props.hasOwnProperty(name)) {
          propsList[name] = true;
        }
      }

      for (var name in propsList) {
        if (name !== '__name' && name !== '__image') {
          compareList.insertAdjacentHTML(
            'beforeend',
            '<li class="compare-list__property">' +
              '<div class="compare-list__property-name">' +
                name +
              '</div>' +
              '<div class="compare-list__property-value">' +
                (good1Props[name] || '—') +
              '</div>' +
              '<div class="compare-list__property-value">' +
                (good2Props[name] || '—') +
              '</div>' +
            '</li>'
          );
        }
      }

      compareList.insertAdjacentHTML(
        'afterbegin',
        '<li class="compare-list__property">' +
          '<div class="compare-list__property-name">&nbsp;</div>' +
          '<div class="compare-list__property-value compare-list__property-value--bold">' +
            good1Props.__name +
          '</div>' +
          '<div class="compare-list__property-value compare-list__property-value--bold">' +
            good2Props.__name +
          '</div>' +
        '</li>'
      );

      compareList.insertAdjacentHTML(
        'afterbegin',
        '<li class="compare-list__property">' +
          '<div class="compare-list__property-name">&nbsp;</div>' +
          '<div class="compare-list__property-value">' +
            '<img class="compare-list__property-image" src="' + good1Props.__image + '" />' +
          '</div>' +
          '<div class="compare-list__property-value">' +
            '<img class="compare-list__property-image" src="' + good2Props.__image + '" />' +
          '</div>' +
        '</li>'
      );

      return true;
    })
    .then(afterCompare)
    .catch(function(err) {
      afterCompare();
      error.classList.add('compare-error--visible');
      error.innerText = err.message;
    });
};

/**
 * App init function
 */
var init = function() {
  compareForm = document.forms.compare;
  good1 = compareForm.elements.good1;
  good2 = compareForm.elements.good2;
  submit = compareForm.elements.compare;
  error = document.querySelector('.compare-error');
  progress = document.querySelector('.compare-progress');
  compareList = document.querySelector('.compare-list');

  if (window.addEventListener) {
    compareForm.addEventListener('submit', compare);
  } else {
    compareForm.attachEvent('submit', compare);
  }
};

if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', init);
} else {
  window.attachEvent('onload', init);
}
