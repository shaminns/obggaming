function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true,
  });
}

// Formats
define("JPEG", "image/jpeg");
define("JPG", "image/jpg");
define("PNG", "image/png");
