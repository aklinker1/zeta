# Changelog

## v1.1.1

[compare changes](https://github.com/aklinker1/zeta/compare/v1.1.0...v1.1.1)

### 🩹 Fixes

- Get meta from `ZetaSchema` when building responses ([c596cd0](https://github.com/aklinker1/zeta/commit/c596cd0))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

## v1.1.0

[compare changes](https://github.com/aklinker1/zeta/compare/v1.0.3...v1.1.0)

### 🚀 Enhancements

- Automatically set response `Content-Type` header based on the `contentType` meta ([8884f54](https://github.com/aklinker1/zeta/commit/8884f54))

### 🩹 Fixes

- **zod:** Target `openapi-3.0` when generating the JSON schema ([f3a36a9](https://github.com/aklinker1/zeta/commit/f3a36a9))

### 📖 Documentation

- Remove vitepress docs ([d33065d](https://github.com/aklinker1/zeta/commit/d33065d))
- Add NPM badge ([b58deb3](https://github.com/aklinker1/zeta/commit/b58deb3))
- Update tagline ([177a638](https://github.com/aklinker1/zeta/commit/177a638))
- Update package.json metadata ([33658c9](https://github.com/aklinker1/zeta/commit/33658c9))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

## v1.0.3

[compare changes](https://github.com/aklinker1/zeta/compare/v1.0.2...v1.0.3)

### 🤖 CI

- Remove old publish script ([821d215](https://github.com/aklinker1/zeta/commit/821d215))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

## v1.0.2

[compare changes](https://github.com/aklinker1/zeta/compare/v1.0.1...v1.0.2)

## v1.0.1

[compare changes](https://github.com/aklinker1/zeta/compare/v1.0.0...v1.0.1)

### 📖 Documentation

- Update changelog ([f92ac7e](https://github.com/aklinker1/zeta/commit/f92ac7e))
- Add link to standard schema website ([3b8ec53](https://github.com/aklinker1/zeta/commit/3b8ec53))
- Tweak README wording ([f89b725](https://github.com/aklinker1/zeta/commit/f89b725))
- Add Vitepress app ([77129d0](https://github.com/aklinker1/zeta/commit/77129d0))

### 🏡 Chore

- Cleanup publishing files ([cd6f813](https://github.com/aklinker1/zeta/commit/cd6f813))
- Fix formatting ([65c907f](https://github.com/aklinker1/zeta/commit/65c907f))

### 🤖 CI

- Add publish workflow and publish to NPM ([c236660](https://github.com/aklinker1/zeta/commit/c236660))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

## v1.0.0

v1 is out! No breaking changes, everything I want to implement is implemented, so I'm updating the version to `1.0.0`.

[compare changes](https://github.com/aklinker1/zeta/compare/v0.7.0...v1.0.0)

### 🚀 Enhancements

- Support model references via a `ref` metadata entry ([e309d7a](https://github.com/aklinker1/zeta/commit/e309d7a))
- Add `app.getOpenApiSpec` so you can get the spec without starting the app ([693477c](https://github.com/aklinker1/zeta/commit/693477c))

### 🏡 Chore

- Fix formatting ([e5ed4ad](https://github.com/aklinker1/zeta/commit/e5ed4ad))

### 🤖 CI

- Update publish script to optionally accept a new verison ([e44ab7b](https://github.com/aklinker1/zeta/commit/e44ab7b))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.6...v0.7.0)

### 🏡 Chore

- **deps:** ⚠️ Upgrade zod from v3 to v4 ([53961f4](https://github.com/aklinker1/zeta/commit/53961f4))

#### ⚠️ Breaking Changes

- **deps:** ⚠️ Upgrade zod from v3 to v4 ([53961f4](https://github.com/aklinker1/zeta/commit/53961f4))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.5...v0.6.6)

### 🩹 Fixes

- **client:** Return a union of success types when multiple are defined ([e5bdddc](https://github.com/aklinker1/zeta/commit/e5bdddc))

### 🏡 Chore

- Add test for client input types ([83a4059](https://github.com/aklinker1/zeta/commit/83a4059))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.4...v0.6.5)

### 🩹 Fixes

- Omit open API keys when generating client input params ([97665aa](https://github.com/aklinker1/zeta/commit/97665aa))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

[compare changes](https://github.com/aklinker1/zeta/compare/v0.6.3...v0.6.4)

### 🚀 Enhancements

- Add `NoResponse` helper ([667fa82](https://github.com/aklinker1/zeta/commit/667fa82))

### ❤️ Contributors

- Aaron ([@aklinker1](https://github.com/aklinker1))

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
