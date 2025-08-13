const pet = {
  hunger: 50,
  happiness: 70,
  energy: 50,
  health: 80, // Overall health status (affected by all activities)
  state: "happy",
  asleep: false,
  toysPlayed: 0,
  doingAction: false
};
let actionTimeout = null;

function clamp(val) {
  return Math.max(0, Math.min(100, val));
}

function updateBars() {
  document.getElementById('hunger-bar').style.width = (100 - pet.hunger) + '%';
  document.getElementById('happiness-bar').style.width = pet.happiness + '%';
  document.getElementById('energy-bar').style.width = pet.energy + '%';
  document.getElementById('health-bar').style.width = pet.health + '%';
  
  if (pet.happiness > 88) document.getElementById('happiness-bar').style.background = "linear-gradient(90deg,#87e685,#33dcf7)";
  else document.getElementById('happiness-bar').style.background = "linear-gradient(90deg,#f7971e,#ffd200)";
  
  // Health bar color changes based on health level
  if (pet.health > 70) document.getElementById('health-bar').style.background = "linear-gradient(90deg,#00b894,#00cec9)";
  else if (pet.health > 30) document.getElementById('health-bar').style.background = "linear-gradient(90deg,#fdcb6e,#e17055)";
  else document.getElementById('health-bar').style.background = "linear-gradient(90deg,#d63031,#e84393)";
}

function setPetImage(state) {
  let src = "pet-happy.PNG";
  if (state === "hungry") src = "pet-hungry.PNG";  // This shows when pet is hungry
  else if (state === "sad") src = "pet-sad.PNG";
  else if (state === "tired") src = "pet-tired.PNG";
  else if (state === "sleeping") src = "pet-sleep.PNG";
  else if (state === "playing") src = "pet-playing.png";
  document.getElementById('pet-img').src = src;
}

function playPetSound(type) {
  // Sound effect code goes here if you have .mp3 files
}

function popupAchievement(msg) {
  const el = document.getElementById("achievement-popup");
  el.textContent = msg;
  el.classList.add("show");
  el.classList.remove("hidden");
  setTimeout(() => el.classList.remove("show"), 2400);
}

function showPetPrompt(message) {
  const el = document.getElementById("pet-prompt");
  el.textContent = message;
  el.classList.add("show");
  el.classList.remove("hidden");
  setTimeout(() => {
    el.classList.remove("show");
    el.classList.add("hidden");
  }, 3000);
}

function showActionImg(imgId, time = 1400) {
  // Instead of showing overlay images, just change the main pet image
  const petImg = document.getElementById('pet-img');
  const originalSrc = petImg.src;
  
  // Change to action image immediately
  if (imgId === 'feeding-img') {
    petImg.src = 'pet-hungry.PNG';
  } else if (imgId === 'playing-img') {
    petImg.src = 'pet-playing.png';
  }
  
  pet.doingAction = true;
  if(actionTimeout) clearTimeout(actionTimeout);
  
  actionTimeout = setTimeout(() => {
    // Restore original image or update based on current state
    pet.doingAction = false;
    updatePetState();
  }, time);
}

function showEatingAnimation() {
  const eatingImg = document.getElementById('pet-eating');  // This shows when feeding
  const petImg = document.getElementById('pet-img');
  
  // Hide main pet image and show eating animation
  petImg.style.opacity = '0.3';
  eatingImg.classList.remove('hidden');
  eatingImg.classList.add('show');
  
  pet.doingAction = true;
  
  // Add eating sound effect placeholder
  setTimeout(() => {
    // Show eating prompt during animation
    showPetPrompt("Nom nom nom! 🍽️ This is delicious!");
  }, 300);
  
  if(actionTimeout) clearTimeout(actionTimeout);
  
  // Calculate eating duration based on hunger level
  const hungerLevel = pet.hunger;
  let eatingDuration;
  
  if (hungerLevel > 75) {
    eatingDuration = 4000; // Very hungry - 4 seconds
  } else if (hungerLevel > 50) {
    eatingDuration = 3000; // Hungry - 3 seconds
  } else if (hungerLevel > 25) {
    eatingDuration = 2000; // Slightly hungry - 2 seconds
  } else {
    eatingDuration = 1500; // Not very hungry - 1.5 seconds
  }
  
  actionTimeout = setTimeout(() => {
    // Hide eating animation and restore pet
    eatingImg.classList.remove('show');
    eatingImg.classList.add('hidden');
    petImg.style.opacity = '1';
    pet.doingAction = false;
    updatePetState(); // This will update the pet image based on current state
  }, eatingDuration);
}

function showPlayingAnimation() {
  const playingImg = document.getElementById('pet-playing');
  const petImg = document.getElementById('pet-img');
  
  // Hide main pet image and show playing animation
  petImg.style.opacity = '0.3';
  playingImg.classList.remove('hidden');
  playingImg.classList.add('show');
  
  pet.doingAction = true;
  
  // Show playing prompt during animation
  setTimeout(() => {
    const playMessages = [
      "Wheee! This is so much fun! 🎉",
      "I love playing with you! 🥳",
      "Bouncy bouncy! Let's play more! 🎾"
    ];
    showPetPrompt(playMessages[Math.floor(Math.random() * playMessages.length)]);
  }, 200);
  
  if(actionTimeout) clearTimeout(actionTimeout);
  
  actionTimeout = setTimeout(() => {
    // Hide playing animation and restore pet
    playingImg.classList.remove('show');
    playingImg.classList.add('hidden');
    petImg.style.opacity = '1';
    pet.doingAction = false;
    updatePetState();
  }, 1500); // 1.5 seconds of playing animation
}

function showSleepingAnimation() {
  const sleepingImg = document.getElementById('pet-sleeping');
  const petImg = document.getElementById('pet-img');
  
  // Hide main pet image and show sleeping animation
  petImg.style.opacity = '0.2';
  sleepingImg.classList.remove('hidden');
  sleepingImg.classList.add('show');
  
  // Show sleep prompt
  setTimeout(() => {
    showPetPrompt("Zzz... Sweet dreams! 🌙💤");
  }, 500);
  
  // Keep sleeping animation running during the entire sleep cycle
  // It will be hidden when the pet wakes up
}

function updatePetState() {
  let stateTxt = document.getElementById('pet-state');
  let img = document.getElementById('pet-img');
  img.classList.remove("blinking-eyes");
  if (pet.asleep) {
    stateTxt.textContent = "Sleeping";
    setPetImage("sleeping");
    return;
  }
  if (pet.doingAction) return; // Lock if animating eating/playing
  
  // Check for urgent needs first
  if (pet.hunger > 75) {
    stateTxt.textContent = "Very Hungry";
    setPetImage("hungry");
    if (Math.random() < 0.4) { // 40% chance to show urgent hunger prompt
      const hungryMessages = [
        "I'm SO hungry! Please feed me! 🍽️",
        "My tummy is rumbling... I need food! 😭",
        "Feed me please! I'm starving! 🥺"
      ];
      showPetPrompt(hungryMessages[Math.floor(Math.random() * hungryMessages.length)]);
    }
  }
  else if (pet.health < 25) {
    stateTxt.textContent = "Sick";
    setPetImage("sad");
    if (Math.random() < 0.4) { // 40% chance to show health prompt
      const sickMessages = [
        "I don't feel very well... 😷",
        "I need some care to feel better! 🤒",
        "Please take better care of me! 😢"
      ];
      showPetPrompt(sickMessages[Math.floor(Math.random() * sickMessages.length)]);
    }
  }
  else if (pet.energy < 20) {
    stateTxt.textContent = "Tired";
    setPetImage("tired");
    if (Math.random() < 0.3) { // 30% chance to show prompt
      showPetPrompt("I need some rest... 😴");
    }
  }
  else if (pet.hunger > 50) {
    stateTxt.textContent = "Hungry";
    setPetImage("hungry");
    if (Math.random() < 0.2) { // 20% chance to show mild hunger prompt
      showPetPrompt("I'm getting a bit hungry... 🍽️");
    }
  }
  else if (pet.happiness < 50) {
    stateTxt.textContent = "Sad";
    setPetImage("sad");
    if (Math.random() < 0.3) { // 30% chance to show mild play prompt
      const sadMessages = [
        "I want to play! Let's have some fun! 🎾",
        "I'm feeling a bit down... can we play? 😔",
        "Playing would make me happy! 🎮"
      ];
      showPetPrompt(sadMessages[Math.floor(Math.random() * sadMessages.length)]);
    }
  }
  else if (pet.happiness < 23) {
    stateTxt.textContent = "Unhappy";
    setPetImage("sad");
    if (Math.random() < 0.3) { // 30% chance to show general sadness prompt
      showPetPrompt("I need some attention... 😢");
    }
  }
  else {
    stateTxt.textContent = "Happy";
    setPetImage("happy");
    img.classList.add("blinking-eyes");
    if (pet.happiness > 80 && pet.health > 70 && Math.random() < 0.2) { // 20% chance when very happy and healthy
      showPetPrompt("I'm so happy! Thanks for taking care of me! 😊");
    }
  }
}

function animatePet() {
  let petImg = document.getElementById('pet-img');
  petImg.style.transform = 'scale(1.07)';
  setTimeout(() => petImg.style.transform = 'scale(1)', 210);
}

function feedPet() {
  if (pet.asleep || pet.doingAction) return;
  
  // Show special eating animation
  showEatingAnimation();
  
  pet.hunger = clamp(pet.hunger - 32);
  pet.energy = clamp(pet.energy + 15);
  pet.happiness = clamp(pet.happiness + 7);
  pet.health = clamp(pet.health + 5); // Feeding improves health
  
  animatePet();
  
  // Show feeding completion message after eating animation
  setTimeout(() => {
    if (Math.random() < 0.7) { // 70% chance
      const feedingMessages = [
        "Yummy! Thank you for feeding me! 😋",
        "That was so tasty! I feel much better! 🤤",
        "More please! That was delicious! 😍"
      ];
      showPetPrompt(feedingMessages[Math.floor(Math.random() * feedingMessages.length)]);
    }
  }, 3500); // Increased delay to account for longer eating times
  
  updateAll();
}
function playPet() {
  if (pet.asleep || pet.doingAction) return;
  
  // Show special playing animation
  showPlayingAnimation();
  
  pet.happiness = clamp(pet.happiness + 14);
  pet.energy = clamp(pet.energy - 17);
  pet.hunger = clamp(pet.hunger + 15);
  pet.health = clamp(pet.health + 8); // Playing improves health through exercise
  pet.toysPlayed++;
  
  if (pet.toysPlayed === 5) popupAchievement("Your pet loves playing!");
  
  // Show playing completion message after playing animation
  setTimeout(() => {
    if (Math.random() < 0.7) { // 70% chance
      const playingMessages = [
        "That was awesome! Let's play again soon! 🎉",
        "I had so much fun! You're the best! 🥳",
        "More! More! I want to play more! 🎾"
      ];
      showPetPrompt(playingMessages[Math.floor(Math.random() * playingMessages.length)]);
    }
  }, 2000); // Increased delay
  
  showToy();
  animatePet();
  
  updateBars();
}
function sleepPet() {
  if (pet.asleep || pet.doingAction) return;
  pet.asleep = true;
  
  // Show sleeping animation
  showSleepingAnimation();
  
  updateAll();
  let sleepInt = setInterval(() => {
    pet.energy = clamp(pet.energy + 4); // Reduced from 6 to 4 for slower recovery
    if (pet.energy >= 100) {
      pet.asleep = false;
      clearInterval(sleepInt);
      
      // Hide sleeping animation when waking up
      const sleepingImg = document.getElementById('pet-sleeping');
      const petImg = document.getElementById('pet-img');
      sleepingImg.classList.remove('show');
      sleepingImg.classList.add('hidden');
      petImg.style.opacity = '1';
      
      popupAchievement("All rested up!");
      showPetPrompt("I feel so refreshed! Ready for more fun! ⭐");
    }
    updateBars();
    updatePetState();
  }, 1000); // Increased from 700ms to 1000ms for slower sleep recovery
}

function showToy() {
  let toy = document.getElementById('pet-toy');
  toy.classList.remove("hidden");
  setTimeout(() => toy.classList.add("hidden"), 1100);
}

function toyDrag() {
  pet.happiness = clamp(pet.happiness + 8);
  popupAchievement("Yay! You dragged the toy!");
  updateAll();
}

function setDayNightBackground() {
  let hour = new Date().getHours();
  document.body.classList.toggle("night-bg", !(hour > 6 && hour < 18));
}
setInterval(setDayNightBackground, 60000); setDayNightBackground();

function updateAll() { updateBars(); updatePetState(); }

function decreaseStats() {
  if (pet.asleep) {
    pet.hunger = clamp(pet.hunger + 1.5); // Reduced from 2 to 1.5
    pet.happiness = clamp(pet.happiness - 0.5); // Reduced from 1 to 0.5
    pet.health = clamp(pet.health + 1); // Reduced from 2 to 1
  } else {
    pet.hunger = clamp(pet.hunger + 2); // Reduced from 3 to 2
    pet.energy = clamp(pet.energy - 1.5); // Reduced from 2 to 1.5
    pet.happiness = clamp(pet.happiness - 0.8); // Reduced from 1 to 0.8
    pet.health = clamp(pet.health - 0.5); // Reduced from 1 to 0.5
  }
  updateAll();
  if (pet.happiness === 100) popupAchievement("Your pet is super happy!");
}

document.getElementById('feed-btn').addEventListener('click', feedPet);
document.getElementById('play-btn').addEventListener('click', playPet);
document.getElementById('sleep-btn').addEventListener('click', sleepPet);
document.getElementById('pet-toy').addEventListener('dragstart', toyDrag);

setInterval(decreaseStats, 2000); // Increased from 1200ms to 2000ms for slower stat decrease
updateAll();
