<h2>
Building:
</h2>

node-destiny uses my automated api wrapper generator (lib/autowrapper)
to build.

the list of endpoints is pulled from https://raw.githubusercontent.com/DestinyDevs/BungieNetPlatform/master/wiki-builder/data/endpoints.json,
and should be up to date.

Currently the API Wrapper generator doesn't support POST endpoints or endpoints that require oAuth, however this is planned in future versions.
How to build:

```
npm install
npm run-script prepare
npm run-script build
```

or

```
npm install
npm run-script prepare
node build.js <Service Name>
```

Possible Service Names can be found here: http://destinydevs.github.io/BungieNetPlatform/docs/Endpoints,
DestinyService is what you should be using for the Destiny Endpoints.
---
