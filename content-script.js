const loginAppSelector = "app-login";
const emailSelector = "input[type=email]";
const pwrdSelector = "input[type=password]:not([hidden])";
const nextButtonSelector = ".email-next-button button";
const welcomBackSelector = "b-avatar-image.avatar";
const printedEmailSelector =
  welcomBackSelector + " + div, b-back-button ~ b-display-1 + div";
const oktaButtonSelector =
  ".inner-wrapper b-button[sso-method=okta-btn] button";
const switchAccountLinkSelector =
  ".password-wrapper + div > b-text-button + div a, .inner-wrapper b-button[sso-method=okta-btn] + div > div > a";
const pageLoadedSelector = `input, ${printedEmailSelector}`; // used to determine if the vital elements are loaded
const steps = {
  email: "email",
  pwrd: "password",
  okta: "okta",
  unknown: "unknown",
};

let myContent;

(function onload() {
  // console.log('Bogin extenstion', 'onload');
  chrome.storage.sync.get(null, (store) => {
    if (!store.data)
      chrome.storage.sync.set({ data: [] }, () => start(store));
    else start(store);
  });
})();

function start(store) {
  myLogins = store.data;
  listenForStorageChanges();
  waitUntilElementExists(loginAppSelector, createLayer);
}

function createLayer() {
  const loginElement = document.querySelector(loginAppSelector);
  if (!loginElement) {
    return;
  }
  myContent = document.createElement("div");
  myContent.id = "boginExtContent";
  waitUntilElementExists(pageLoadedSelector, createClickableLogins);
  try {
    loginElement.appendChild(myContent);
  } catch (error) {}
}

function createClickableLogins() {
  let alreadyLoggedInEmail =
    whereAmI() === steps.pwrd || whereAmI() === steps.okta
      ? sel(printedEmailSelector)?.innerText
      : null;

  alreadyLoggedInEmail &&
    sel(switchAccountLinkSelector).addEventListener("click", function () {
      myContent.innerHTML = "";
      waitUntilElementExists(pageLoadedSelector, createClickableLogins);
    });

  let hasClickable = false;
  for ([idx, loginConfig] of myLogins.entries()) {
    if (whereAmI() === steps.okta) {
      createOktaClickable();
      break;
    }
    if (
      alreadyLoggedInEmail &&
      alreadyLoggedInEmail.trim() !== loginConfig.email
    ) {
      if (idx === myLogins.length - 1 && !hasClickable) {
        emptyClickable();
      }
      continue;
    }
    hasClickable = true;
    const login = loginConfig; // to avoid closure
    const clickable = document.createElement("button");
    const className = loginConfig.okta ? 'clickable okta' : 'clickable';
    clickable.type = "button";
    clickable.className = className;
    clickable.innerText = loginConfig.label;
    clickable.addEventListener("click", function () {
      optionClicked(login);
    });
    clickable.addEventListener("mouseover", function () {
      optionHovered(login);
    });
    myContent.appendChild(clickable);
  }
}

function createOktaClickable() {
  const clickable = document.createElement("button");
  clickable.type = "button";
  clickable.className = "clickable okta";
  clickable.innerText = myLogins.find((login) => login.okta).label;
  clickable.addEventListener("click", function () {
    sel(oktaButtonSelector).click();
  });
  myContent.appendChild(clickable);
}

function optionClicked(loginConfig) {
  if (whereAmI() === steps.email) {
    fillEmail(loginConfig);
    loginConfig.password && waitUntilElementExists(pwrdSelector, fillPassword, loginConfig);
  }
  if (whereAmI() === steps.pwrd) {
    waitUntilElementExists(pwrdSelector, fillPassword, loginConfig);
  }
}

function optionHovered(loginConfig) {
  if (whereAmI() === steps.email) {
    sel(emailSelector).value = loginConfig.email;
  }
}

function emptyClickable() {
  const clickable = document.createElement("button");
  clickable.type = "button";
  clickable.className = 'clickable empty';
  clickable.innerText = '😲';
  clickable.addEventListener("click", function () {
    clickable.innerText = clickable.innerText === '😲' ? '🥱' : '😲';
  });
  myContent.appendChild(clickable);
}

function fillEmail(loginConfig) {
  sel(emailSelector).value = loginConfig.email;
  sel(emailSelector).dispatchEvent(new Event("input", { bubbles: true }));
  getNextButton().click();
}

function fillPassword(loginConfig) {
  const pwrd = sel(pwrdSelector);
  pwrd.value = loginConfig.password;
  pwrd.dispatchEvent(new Event("input", { bubbles: true }));
  getNextButton().click();
}

// Utility functions

function whereAmI() {
  const email = sel(emailSelector);
  const pwrd = sel(pwrdSelector);
  const welcomeBack = sel(welcomBackSelector);

  return email
    ? steps.email
    : pwrd
    ? steps.pwrd
    : !pwrd && welcomeBack
    ? steps.okta
    : steps.unknown;
}

function waitUntilElementExists(selector, callback, callbackArg) {
  let i = 0;
  const repetitions = 30;
  const intervalId = window.setInterval(function () {
    const element = sel(selector);
    if (element) {
      clearInterval(intervalId);
      if (callbackArg) 
        callback(callbackArg);
      else callback();
    }
    if (++i === repetitions) {
      window.clearInterval(intervalId);
      // console.log('* Bogin extenstion *', 'waitUntilElementExists() reached max iteration.', 'Element',selector , 'Not Found');
    }
  }, 100);
}

function getNextButton() {
  return sel(nextButtonSelector);
}

function sel(selector) {
  return document.querySelector(selector);
}

// Storage


function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const storeLogins = changes.data.newValue;
    myContent.innerHTML = ""; // clear existing clickable logins
    if (Array.isArray(storeLogins) && storeLogins.length) {
      createStoreLogins(storeLogins);
    } else {
      myLogins = [];
    }
  });
}

function createStoreLogins(storeLogins) {
  myLogins = storeLogins;
  createClickableLogins();
}

