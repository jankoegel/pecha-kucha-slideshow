const overview = document.getElementById("overview");
const thumbnailsContainer = document.getElementById("thumbnails");
const startBtn = document.getElementById("start-btn");
const slideshow = document.getElementById("slideshow");
const slideImage = document.getElementById("slide-image");
const timerDisplay = document.getElementById("timer");
const SLIDE_DURATION_MS = 20000;

let isPaused = false;
let slideStartTime = 0;
let remainingTime = SLIDE_DURATION_MS;
let elapsedSeconds = 0;
let secondInterval = null;
let images = [];
let currentIndex = 0;
let timer = null;

function showSlide() {
  slideImage.src = images[currentIndex].url;

  const labelEl = document.getElementById("image-label");
  const fileName = images[currentIndex].name;

  if (/^jank/i.test(fileName)) {
    let label = fileName.replace(/\.(jpg|jpeg)$/i, "");
    label = label.replace(/^jank\s*-\s*\d+\s*(?:-\s*)?/i, "");
    label = label.trim();

    if (label.length > 0) {
      labelEl.textContent = label;
      labelEl.classList.remove("hidden");
    } else {
      labelEl.classList.add("hidden");
    }
  } else {
    labelEl.classList.add("hidden");
  }

  // update slide counter
  const slideCounter = document.getElementById("slide-counter");
  slideCounter.textContent = `${currentIndex + 1} / ${images.length}`;

  // reset timer
  elapsedSeconds = 0;
  timerDisplay.textContent = `${elapsedSeconds} s`;
  clearInterval(secondInterval);
  clearTimeout(timer);

  isPaused = false;
  remainingTime = SLIDE_DURATION_MS;
  slideStartTime = Date.now();

  secondInterval = setInterval(() => {
    if (!isPaused) {
      elapsedSeconds++;
      timerDisplay.textContent = `${elapsedSeconds} s`;
    }
  }, 1000);

  function nextSlide() {
    currentIndex++;
    if (currentIndex < images.length) {
      showSlide();
    } else {
      endSlideshow();
    }
  }

  function tick() {
    if (!isPaused) {
      const elapsed = Date.now() - slideStartTime;
      if (elapsed >= remainingTime) {
        nextSlide();
      } else {
        timer = setTimeout(tick, remainingTime - elapsed);
      }
    }
  }

  timer = setTimeout(tick, remainingTime);
}


/* ----------------------------------------------------
   CRITICAL FIX:
   Prevent browser from opening dragged files
---------------------------------------------------- */

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

/* --- Drop Zone Highlight --- */

document.addEventListener("dragover", e => {
  e.preventDefault();
});

document.addEventListener("dragleave", e => {
  e.preventDefault();
})

/* --- Handle Drop --- */
document.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const files = Array.from(e.dataTransfer.files)
    .filter(file =>
      file.type.startsWith("image/jpeg") ||
      file.type.startsWith("image/jpg") ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg")
    ).sort((a, b) => a.name.localeCompare(b.name));
  
  // reset any previous slideshow state
  currentIndex = 0;
  clearTimeout(timer);
  clearInterval(secondInterval);
  
  images = files.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file)
  }));

  showOverview();
});


/* --- Overview --- */

function showOverview() {
  overview.classList.remove("hidden");

  thumbnailsContainer.innerHTML = "";

  images.forEach((img, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thumb";
    const number = document.createElement("span");
    number.className = "thumb-index";
    number.textContent = index + 1;
    const thumb = document.createElement("img");
    thumb.src = img.url;
    thumb.alt = img.name;
    wrapper.appendChild(thumb);
    wrapper.appendChild(number);
    thumbnailsContainer.appendChild(wrapper);

    // Start slideshow from this image on click
    wrapper.addEventListener("click", () => {
      currentIndex = index;
      overview.classList.add("hidden");
      slideshow.classList.remove("hidden");
      showSlide();
      if (!document.fullscreenElement) {
        slideshow.requestFullscreen();
      }
    });
  });
}

/* --- Slideshow --- */
startBtn.addEventListener("click", () => {
  overview.classList.add("hidden");
  slideshow.classList.remove("hidden");
  currentIndex = 0;
  showSlide();
  // Auto-enter fullscreen when slideshow starts
  if (!document.fullscreenElement) {
    slideshow.requestFullscreen();
  }
});

function endSlideshow() {
  clearTimeout(timer);
  clearInterval(secondInterval);
  slideshow.classList.add("hidden");
  overview.classList.remove("hidden");

  slideshow.classList.add("hidden");

  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}

function nextImage() {
  clearTimeout(timer);
  clearInterval(secondInterval);

  currentIndex++;
  if (currentIndex >= images.length) {
    currentIndex = images.length - 1;
  }

  showSlide();
}

function previousImage() {
  clearTimeout(timer);
  clearInterval(secondInterval);

  currentIndex--;
  if (currentIndex < 0) {
    currentIndex = 0;
  }

  showSlide();
}

document.addEventListener("keydown", (e) => {
  if (!slideshow.classList.contains("hidden")) {
    if (e.code === "Space") {
      e.preventDefault();
      isPaused = !isPaused;
      if (!isPaused) {
        // resume timer
        slideStartTime = Date.now();
        timer = setTimeout(() => {
          currentIndex++;
          if (currentIndex < images.length) showSlide();
          else endSlideshow();
        }, remainingTime - elapsedSeconds * 1000);
      }
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      nextImage();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      previousImage();
    } else if (e.code === "Escape") {
      endSlideshow();
    }
  }
});
