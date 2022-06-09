let data = [];
const OKTA_FORM_NAME = 'formOkta';

function loaded() {
  bindButtonsClick();
  chrome.storage.sync.get(null, (store) => {
    if (!store.data) {
      chrome.storage.sync.set({ data: [] }, () => data = []);
    } else {
      data = store.data;
    }
    populateForms(data);
  });
}

document.addEventListener("DOMContentLoaded", loaded);

function bindButtonsClick() {
  document.querySelectorAll('[type=button][name=save]').forEach(btn => btn.addEventListener("click", saveClicked));
  document.querySelectorAll('[type=button][name=delete]').forEach(btn => btn.addEventListener("click", deleteClicked));
}

function saveClicked() {
  const formContainer = event.target.form;
  const okta = formContainer.name === OKTA_FORM_NAME;
  const labelEl = formContainer.label;
  const emailEl = formContainer.email;
  const passwordEl = formContainer?.password;

  const label = labelEl.value;
  const email = emailEl.value;
  const password = passwordEl ? passwordEl.value : null;

  if (!label || !email) {
    response('Label and Email are mandatory');
    return;
  }

  labelEl.disabled = true;
  emailEl.disabled = true;
  formContainer.save.disabled = true;
  if (passwordEl) { passwordEl.disabled = true; }

  data = [...data, { label, email, password, okta }];
  // log(data);
  saveToStorage(data);
}

function deleteClicked() {
  const formContainer = event.target.form;
  const email = formContainer.email.value;

  clearRow(formContainer);
  data = data.filter(item => item.email !== email);
  saveToStorage(data);
}

function saveToStorage(data) {
  chrome.storage.sync.set({ data },
    () => response('Saved'));
}

function populateForms(storeData) {
  // log(storeData);
  showOktaImage();

  let index = 0;
  storeData.forEach((item) => {
    const formName = item.okta ? OKTA_FORM_NAME : `form${index+1}`;
    const labelEl = document[formName].label;
    const emailEl = document[formName].email;
    const passwordEl = document[formName]?.password;
    if (passwordEl) {
      passwordEl.value = item.password;
      passwordEl.disabled = true;
    }
    labelEl.value = item.label;
    emailEl.value = item.email;
    labelEl.disabled = true;
    emailEl.disabled = true;
    document[formName].save.disabled = true;
    index = item.okta ? index : index + 1;
  });
}

function clearRow(frm) {
  frm.label.value = '';
  frm.email.value = '';
  if (frm.password) {
    frm.password.value = ''; 
    frm.password.disabled = false; 
  }
  frm.label.disabled = false;
  frm.email.disabled = false;
  frm.save.disabled = false;
  response('Row cleared');
}

function showOktaImage() {
  const image = document.createElement("img");
  image.src = chrome.runtime.getURL("images/okta.png");
  sel('#oktaPlaceholder').append('Bob\'s ', image, ' account');
}

sel("#clearAll").addEventListener("click", () => {
  Array.from(document.forms).forEach(form => clearRow(form));
  chrome.storage.sync.set({ data: [] }, () => {
    data = [];
    response('All data cleared');
  });
});

function sel(selector) {
  return document.querySelector(selector);
}

function response(text) {
  sel("#msg").innerText = text;
  setTimeout(() => {
    sel("#msg").innerText = '';
  }, 1800);
}

function log(thing) {
  sel('#log').innerText = JSON.stringify(thing);
}

