# Changelog

## v0.6.3

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.2...v0.6.3)

### 🩹 Fixes

- **types:** Properly build request context type ([c4922f0](https://github.com/aklinker1/zeta/commit/c4922f0))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.1...v0.6.2)

### 🩹 Fixes

- **types:** Make `ErrorResponse` type a `StandardSchema` so input params are parsed correctly ([2b412d8](https://github.com/aklinker1/zeta/commit/2b412d8))

### 📖 Documentation

- Update changelog ([320daf2](https://github.com/aklinker1/zeta/commit/320daf2))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.0...v0.6.1)

### 🩹 Fixes

- Remove slow type ([da55d20](https://github.com/aklinker1/zeta/commit/da55d20))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.5.0...v0.6.0)

### 🚀 Enhancements

- ⚠️ Multiple responses ([69ba98a](https://github.com/aklinker1/zeta/commit/69ba98a))

### 🏡 Chore

- ⚠️ Rename `Status` and `XyzError` to `HttpStatus` and `XyzHttpError` ([8c50436](https://github.com/aklinker1/zeta/commit/8c50436))

#### ⚠️ Breaking Changes

- When defining an endpoint, `response` was renamed to `responses`
- `onGlobalError` no longer supports a return type. Zeta converts all errors into responses automatically
- Fix typo in type name: `OnGlobalErrorHoos` → `OnGlobalErrorHooks`
- `@aklinker1/zeta/status` is merged into `@aklinker1/zeta`
- Rename `Status` and `XyzError` to `HttpStatus` and `XyzHttpError` ([8c50436](https://github.com/aklinker1/zeta/commit/8c50436))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.4.0...v0.5.0)

### 🏡 Chore

- ⚠️ Generalize the `getResponseContentType` adapter method to `getMeta` ([246519b](https://github.com/aklinker1/zeta/commit/246519b))

#### ⚠️ Breaking Changes

- ⚠️ Generalize the `getResponseContentType` adapter method to `getMeta` ([246519b](https://github.com/aklinker1/zeta/commit/246519b))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.3.1...v0.4.0)

### 🚀 Enhancements

- ⚠️ Allow customizing the response content type on OpenAPI docs ([2721e7f](https://github.com/aklinker1/zeta/commit/2721e7f))

### 📖 Documentation

- Add changelog badge to README ([471232d](https://github.com/aklinker1/zeta/commit/471232d))

### 🏡 Chore

- Remove log from publish script ([4b300d6](https://github.com/aklinker1/zeta/commit/4b300d6))

#### ⚠️ Breaking Changes

- ⚠️ Allow customizing the response content type on OpenAPI docs ([2721e7f](https://github.com/aklinker1/zeta/commit/2721e7f))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.3.0...v0.3.1)

### 🏡 Chore

- Use changelogen to generate changelog ([ec4c987](https://github.com/aklinker1/zeta/commit/ec4c987))
- Add CHANGELOG ([ee57526](https://github.com/aklinker1/zeta/commit/ee57526))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))
