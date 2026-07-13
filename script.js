// ---------- Elements ----------
const options = document.querySelectorAll('.coin-option');
const buyBtn = document.getElementById('buyBtn');
const customOption = document.querySelector('.coin-option.custom');

const usernameEl = document.getElementById('username');
const usernameInput = document.getElementById('usernameInput');
const balanceEl = document.getElementById('balance');
const avatarImg = document.getElementById('avatarImg');
const avatarWrap = document.getElementById('avatarWrap');
const avatarInput = document.getElementById('avatarInput');
const searchUsernameInput = document.getElementById('searchUsernameInput');

const lookupProfile = document.getElementById('lookupProfile');
const lookupAvatar = document.getElementById('lookupAvatar');
const lookupName = document.getElementById('lookupName');
const lookupUsername = document.getElementById('lookupUsername');
const lookupFollowers = document.getElementById('lookupFollowers');
const lookupFollowing = document.getElementById('lookupFollowing');

const chevronBtn = document.getElementById('chevronBtn');
const expandPanel = document.getElementById('expandPanel');
const nameEdit = document.getElementById('nameEdit');
const balanceEdit = document.getElementById('balanceEdit');
const expandPhotoBtn = document.getElementById('expandPhotoBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const customBackdrop = document.getElementById('customBackdrop');
const customSheetWrap = document.getElementById('customSheetWrap');
const customBackBtn = document.getElementById('customBackBtn');
const customCoinInput = document.getElementById('customCoinInput');
const coinsInputBox = document.querySelector('.coins-input-box');
const customTotal = document.getElementById('customTotal');
const customRechargeBtn = document.getElementById('customRechargeBtn');
const keypadKeys = document.querySelectorAll('.keypad-key');
const keypadBack = document.getElementById('keypadBack');

const orderBackdrop = document.getElementById('orderBackdrop');
const orderSheetWrap = document.getElementById('orderSheetWrap');
const orderBackBtn = document.getElementById('orderBackBtn');
const orderAvatar = document.getElementById('orderAvatar');
const orderUsername = document.getElementById('orderUsername');
const orderPurchaseLabel = document.getElementById('orderPurchaseLabel');
const orderPurchasePrice = document.getElementById('orderPurchasePrice');
const orderTotal = document.getElementById('orderTotal');
const payNowBtn = document.getElementById('payNowBtn');
const termsRow = document.getElementById('termsRow');
const termsCheckbox = document.getElementById('termsCheckbox');
const paymentOptions = document.querySelectorAll('.payment-option[data-pay]');
const payCardOption = document.getElementById('payCardOption');
const enableBtn = document.getElementById('enableBtn');

// Processing Sequence Pipeline View Component Interactivity Selectors
const paymentOverlay = document.getElementById('paymentOverlay');
const processingContainer = document.getElementById('processingContainer');
const successCard = document.getElementById('successCard');
const successCoinsCount = document.getElementById('successCoinsCount');
const successGoBackBtn = document.getElementById('successGoBackBtn');

// ---------- Constants & State Variables ----------
const COIN_RATE = 0.0105; 
const MIN_COINS = 30;
const MAX_COINS = 2500000;

let tiktokUser = null;

const DEFAULT_AVATAR =
"https://api.dicebear.com/7.x/adventurer/svg?seed=user";

// Lookup card starts hidden — only shown once a search has actually run
if (lookupProfile) lookupProfile.style.display = 'none';

let selectedCoins = 30;
let selectedPrice = '0.31';
let customDigits = '';
let termsAgreed = false;
let orderCoins = 0;
let orderPrice = '0.00';

// ---------- Coin package selection ----------
function setBuyPrice(price) {
  buyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"/></svg> Buy for US$${price}`;
}

options.forEach(opt => {
  opt.addEventListener('click', () => {
    if (opt.dataset.custom) {
      openCustomSheet();
      return;
    }
    options.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedCoins = Number(opt.dataset.coins);
    selectedPrice = opt.dataset.price;
    setBuyPrice(opt.dataset.price);
  });
});

buyBtn.addEventListener('click', () => {
  openOrderSheet(selectedCoins, selectedPrice);
});

// ---------- Enable notifications button ----------
enableBtn.addEventListener('click', () => {
  enableBtn.textContent = 'Enabled';
  enableBtn.disabled = true;
});

async function lookupTikTokUser() {

    let username = searchUsernameInput.value.trim();

    if (!username) return;

    username = username.replace("@","");

    // Reveal the lookup card as soon as a search starts
    lookupProfile.style.display = 'flex';

    lookupAvatar.src = DEFAULT_AVATAR;
    lookupName.textContent = "Loading...";
    lookupUsername.textContent = "@" + username;
    lookupFollowers.textContent = "...";
    lookupFollowing.textContent = "...";

    try{

        const res = await fetch(
            `/api/tiktok?username=${encodeURIComponent(username)}`
        );

        const data = await res.json();

        if(!data.success){

            lookupAvatar.src = DEFAULT_AVATAR;
            lookupName.textContent = username;
            lookupUsername.textContent = "@" + username;
            lookupFollowers.textContent = "0";
            lookupFollowing.textContent = "0";

            tiktokUser = null;

            return;

        }

        tiktokUser = data;

        lookupAvatar.src = data.avatar;
        lookupName.textContent = data.nickname || data.username;
        lookupUsername.textContent = "@" + data.username;
        lookupFollowers.textContent = Number(data.followers).toLocaleString();
        lookupFollowing.textContent = Number(data.following).toLocaleString();

    }

    catch(e){

        lookupAvatar.src = DEFAULT_AVATAR;
        lookupName.textContent = "Connection Error";
        lookupUsername.textContent = "@" + username;
        lookupFollowers.textContent = "0";
        lookupFollowing.textContent = "0";

    }

}

// Auto-detect while typing — debounced so it doesn't fire an API call on every keystroke
let searchDebounceTimer = null;

// Trigger the lookup once, on Enter — not re-bound every time the order sheet opens
searchUsernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    clearTimeout(searchDebounceTimer);
    lookupTikTokUser();
  }
});

searchUsernameInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);

  const value = searchUsernameInput.value.trim();

  if (!value) {
    lookupProfile.style.display = 'none';
    tiktokUser = null;
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    lookupTikTokUser();
  }, 500);
});

// ---------- Custom coin bottom sheet ----------
function formatCoins(digits) {
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

function refreshCustomDisplay() {
  customCoinInput.value = formatCoins(customDigits);
  if (coinsInputBox) {
    coinsInputBox.classList.toggle('filled', customDigits.length > 0);
  }

  const coins = Number(customDigits || 0);
  const valid = coins >= MIN_COINS && coins <= MAX_COINS;

  if (coins > 0) {
    const price = (coins * COIN_RATE).toFixed(2);
    customTotal.textContent = `US$${price}`;
  } else {
    customTotal.textContent = 'US$0';
  }

  customRechargeBtn.disabled = !valid;
}

function openCustomSheet() {
  customDigits = '';
  refreshCustomDisplay();
  customBackdrop.classList.add('open');
  customSheetWrap.classList.add('open');
}

function deleteCustomPackageElements() {
  customOption.classList.remove('selected');
  customOption.dataset.coins = "";
  customOption.dataset.price = "";
  customOption.querySelector('.coin-amount').textContent = "Custom";
  const addedPriceTag = customOption.querySelector('.coin-price');
  if (addedPriceTag) addedPriceTag.remove();
}

function closeCustomSheet() {
  customBackdrop.classList.remove('remove');
  customBackdrop.classList.remove('open');
  customSheetWrap.classList.remove('open');
}

customBackdrop.addEventListener('click', closeCustomSheet);
customBackBtn.addEventListener('click', closeCustomSheet);

keypadKeys.forEach(key => {
  key.addEventListener('click', () => {
    const val = key.dataset.key;
    if (key === keypadBack) {
      customDigits = customDigits.slice(0, -1);
    } else if (val === '000') {
      const next = customDigits + '000';
      if (next.length <= 7) customDigits = next;
    } else if (val) {
      const next = customDigits + val;
      if (next.length <= 7) customDigits = next;
    }
    customDigits = customDigits.replace(/^0+(?=\d)/, '');
    refreshCustomDisplay();
  });
});

customRechargeBtn.addEventListener('click', () => {
  if (customRechargeBtn.disabled) return;
  const coins = Number(customDigits);
  const price = (coins * COIN_RATE).toFixed(2);

  options.forEach(o => o.classList.remove('selected'));
  customOption.classList.add('selected');
  customOption.dataset.coins = coins;
  customOption.dataset.price = price;
  customOption.querySelector('.coin-amount').innerHTML =
    `<img src="coin.png" alt="coin">${coins.toLocaleString('en-US')}`;
  
  let priceEl = customOption.querySelector('.coin-price');
  if (!priceEl) {
    priceEl = document.createElement('div');
    priceEl.className = 'coin-price';
    customOption.appendChild(priceEl);
  }
  priceEl.textContent = `US$${price}`;

  selectedCoins = coins;
  selectedPrice = price;
  setBuyPrice(price);
  closeCustomSheet();
  openOrderSheet(coins, price);
});

// ---------- Chevron expand panel ----------
chevronBtn.addEventListener('click', () => {
  const isOpen = expandPanel.classList.toggle('open');
  chevronBtn.classList.toggle('open', isOpen);
  if (isOpen) {
    nameEdit.value = usernameEl.textContent.trim();
    balanceEdit.value = balanceEl.textContent.trim();
  }
});

// ---------- Inline click-to-edit on name ----------
usernameEl.addEventListener('click', () => {
  usernameInput.value = usernameEl.textContent.trim();
  usernameEl.hidden = true;
  usernameInput.hidden = false;
  usernameInput.focus();
  usernameInput.select();
});

function commitInlineName() {
  const val = usernameInput.value.trim();
  if (val) {
    usernameEl.textContent = val;
  }
  usernameInput.hidden = true;
  usernameEl.hidden = false;
}

usernameInput.addEventListener('blur', commitInlineName);
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') usernameInput.blur();
});

// ---------- Avatar upload ----------
avatarWrap.addEventListener('click', () => avatarInput.click());
expandPhotoBtn.addEventListener('click', () => avatarInput.click());

avatarInput.addEventListener('change', () => {
  const file = avatarInput.files && avatarInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// ---------- Save changes from expand panel ----------
saveProfileBtn.addEventListener('click', () => {
  const newName = nameEdit.value.trim();
  if (newName) {
    usernameEl.textContent = newName;
  }

  let newBalance = parseInt(balanceEdit.value, 10);
  if (isNaN(newBalance) || newBalance < 0) newBalance = 0;
  balanceEl.textContent = newBalance;

  expandPanel.classList.remove('open');
  chevronBtn.classList.remove('open');
});

// ---------- Order summary bottom sheet ----------
function refreshPayNowState() {
  payNowBtn.disabled = !termsAgreed;
}

function openOrderSheet(coins, price) {
  orderCoins = coins;
  orderPrice = price;

  orderAvatar.src = avatarImg.src;

  if(tiktokUser){

    orderUsername.textContent = tiktokUser.username;

    orderAvatar.src = tiktokUser.avatar;

}else{

    const typedSearch = searchUsernameInput.value.trim();

    orderUsername.textContent =
        typedSearch
        ? typedSearch
        : usernameEl.textContent.trim();

    orderAvatar.src = avatarImg.src;

}

  orderPurchaseLabel.textContent = `Purchase of ${coins.toLocaleString('en-US')} Coins`;
  orderPurchasePrice.textContent = `US$${price}`;
  orderTotal.textContent = `US$${price}`;

  termsAgreed = false;
  termsCheckbox.classList.remove('checked');
  paymentOptions.forEach(o => o.classList.remove('selected'));
  refreshPayNowState();

  orderBackdrop.classList.add('open');
  orderSheetWrap.classList.add('open');
}

function closeOrderSheet() {
  orderBackdrop.classList.remove('open');
  orderSheetWrap.classList.remove('open');
}

orderBackdrop.addEventListener('click', closeOrderSheet);
orderBackBtn.addEventListener('click', closeOrderSheet);

paymentOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    paymentOptions.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
  });
});

payCardOption.addEventListener('click', () => {
  paymentOptions.forEach(o => o.classList.remove('selected'));
});

termsRow.addEventListener('click', () => {
  termsAgreed = !termsAgreed;
  termsCheckbox.classList.toggle('checked', termsAgreed);
  refreshPayNowState();
});

// ---------- Payment Sequence Engine (Processing -> Success Card) ----------
payNowBtn.addEventListener('click', () => {
  if (payNowBtn.disabled) return;

  const currentBalance = parseInt(balanceEl.textContent, 10) || 0;
  balanceEl.textContent = currentBalance + orderCoins;

  closeOrderSheet();

  successCoinsCount.textContent = orderCoins.toLocaleString('en-US');

  processingContainer.style.display = 'flex';
  processingContainer.style.opacity = '1';
  successCard.style.display = 'none';
  successCard.classList.remove('show');

  paymentOverlay.classList.add('open');

  setTimeout(() => {
    processingContainer.style.opacity = '0';
    
    setTimeout(() => {
      processingContainer.style.display = 'none';
      successCard.style.display = 'flex';
      
      requestAnimationFrame(() => {
        successCard.classList.add('show');
      });
    }, 250);

  }, 3000);
});

// ---------- Go Back Workflow Reset handler ----------
successGoBackBtn.addEventListener('click', () => {
  paymentOverlay.classList.remove('open');
  
  setTimeout(() => {
    // 1. Reset selection states to default package item (30 Coins)
    options.forEach(o => o.classList.remove('selected'));
    const initialDefaultOption = options[0];
    if (initialDefaultOption) {
      initialDefaultOption.classList.add('selected');
      selectedCoins = Number(initialDefaultOption.dataset.coins) || 30;
      selectedPrice = initialDefaultOption.dataset.price || '0.31';
      setBuyPrice(selectedPrice);
    }

    // 2. Clear out the search username input field completely
    searchUsernameInput.value = '';

    tiktokUser = null;

    // Hide the lookup card again — don't show stale/old lookup data
    lookupProfile.style.display = 'none';
    lookupAvatar.src = DEFAULT_AVATAR;
    lookupName.textContent = "TikTok User";
    lookupUsername.textContent = "@username";
    lookupFollowers.textContent = "0";
    lookupFollowing.textContent = "0";

    // NOTE: profile display name, coin balance, and avatar are left untouched —
    // they should only ever change when the user edits them (or via a purchase).

    // 3. Wipe custom card elements fields clean
    deleteCustomPackageElements();
    customDigits = '';
    
    // 4. Clear visibility state markers on internal view wrappers safely
    successCard.classList.remove('show');
  }, 400);
});
