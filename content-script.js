const loginAppSelector = 'app-login';
const emailSelector = 'input[type=email]';
const pwrdSelector = 'input[type=password]';
const nextButtonSelector = '.email-next-button button';
const welcomBackSelector = 'b-avatar-image.avatar';
const printedEmailSelector =
  welcomBackSelector + ' + div, b-back-button ~ b-display-1 + div';
const oktaButtonSelector = '.inner-wrapper b-button[sso-method=okta-btn] button';
const switchAccountLinkSelector =
  '.password-wrapper + div > b-text-button + div a, .inner-wrapper b-button[sso-method=okta-btn] + div > div > a';
const pageLoadedSelector = `input, ${printedEmailSelector}`; // used to determine if the vital elements are loaded
const steps = {
  email: 'email',
  pwrd: 'password',
  okta: 'okta',
  unknown: 'unknown',
};
const logins = [
  {
    label: 'Demo',
    email: 'miki.ashkenazi+demo@hibob.io',
    password: 'SecretDemo1',
  },
  {
    label: 'mi3',
    email: 'miki.ashkenazi+mi3@hibob.io',
    password: 'SecretDemo3',
  },
  {
    label: 'bob',
    email: 'miki.ashkenazi@hibob.io',
    okta: true,
  },
];
let myContent;

(function onload() {
  // console.log('Bogin extenstion', 'onload');
  // observePageChange();
  waitUntilElementExists(loginAppSelector, createLayer);
})();

function createLayer() {
  const loginElement = document.querySelector(loginAppSelector);
  if (!loginElement) {
    return;
  }
  myContent = document.createElement('div');
  myContent.id = 'boginExtContent';
  waitUntilElementExists(pageLoadedSelector, createClickableLogins);
  try {
    loginElement.appendChild(myContent);
  } catch (error) {
  }
}

function createClickableLogins() {
  let alreadyLoggedInEmail =
    whereAmI() === steps.pwrd || whereAmI() === steps.okta
      ? sel(printedEmailSelector)?.innerText
      : null;

  alreadyLoggedInEmail &&
    sel(switchAccountLinkSelector).addEventListener('click', function () {
      myContent.innerHTML = '';
      waitUntilElementExists(pageLoadedSelector, createClickableLogins);
    });

  for (loginConfig of logins) {
    if (whereAmI() === steps.okta) {
      createOktaClickable();
      break;
    }
    if (
      alreadyLoggedInEmail &&
      alreadyLoggedInEmail.trim() !== loginConfig.email
    ) {
      continue;
    }
    const login = loginConfig; // to avoid closure
    const clickable = document.createElement('button');
    clickable.type = 'button';
    clickable.className = 'clickable';
    clickable.innerText = loginConfig.label;
    clickable.addEventListener('click', function () {
      optionClicked(login);
    });
    myContent.appendChild(clickable);
  }
}

function createOktaClickable() {
  const clickable = document.createElement('button');
  clickable.type = 'button';
  clickable.className = 'clickable';
  clickable.innerText = logins.find(login => login.okta).label;
  clickable.addEventListener('click', function () {
    sel(oktaButtonSelector).click();
  });
  myContent.appendChild(clickable);
}

function optionClicked(loginConfig) {
  if (whereAmI() === steps.email) {
    fillEmail(loginConfig);
    loginConfig.password && fillPassword(loginConfig);
  }
  if (whereAmI() === steps.pwrd) {
    fillPassword(loginConfig);
  }
}

function fillEmail(loginConfig) {
  sel(emailSelector).value = loginConfig.email;
  sel(emailSelector).dispatchEvent(new Event('input', { bubbles: true }));
  getNextButton().click();
}

function fillPassword(loginConfig) {
  setTimeout(() => {
    const pwrd = document.querySelector(pwrdSelector);
    pwrd.value = loginConfig.password;
    pwrd.dispatchEvent(new Event('input', { bubbles: true }));
    getNextButton().click();
  }, 1000);
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

function waitUntilElementExists(selector, callback, repetitions = 12) {
  let i = 0;
  const intervalId = window.setInterval(function () {
    const element = sel(selector);
    if (element) {
      clearInterval(intervalId);
      callback();
    }
    if (++i === repetitions) {
        window.clearInterval(intervalId);
    }
  }, 100);
}

function getNextButton() {
  return sel(nextButtonSelector);
}

function sel(selector) {
  return document.querySelector(selector);
}

// function observePageChange() {
//   const observedContainer = sel(loginApp);
//   const callback = function (mutations) {
//     let email, password, welcomBack;
//     mutations.forEach(function (mutation) {
//       if (mutation.addedNodes[0]) {
//         switch (mutation.addedNodes[0]?.tagName?.toLowerCase()) {
//           case 'app-login-form-password':
//             password = true;
//             break;      
//           case 'app-login-form-email':
//             email = true;
//             break;
//           case 'app-welcome-back':
//             welcomBack = true;
//             break;
//         }
//       }
//     });
//     const change = email ? 'email' : welcomBack && password ? 'welcomeBackPassword' : welcomBack && !password ? 'welcomeBackOkta' : null;
//   };

//   const observer = new MutationObserver(callback);
//   if (observedContainer) {
//     observer.observe(observedContainer, { subtree: true, childList: true });
//   }
// }