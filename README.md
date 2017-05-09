<h2>
node-bungie
</h2>

<h3>About:</h3>
node-bungie uses my auto API wrapper generator to generate API Wrappers for all GET endpoints and for all Services listed
at http://destinydevs.github.io/BungieNetPlatform/docs/Endpoints.

Because of this, the generated wrapper should be up to date, however due to the undocumented nature of many parts of the API most endpoints will not work.

---
<h3>Building:</h3>
Due to the lack of documentation for non Destiny Services, I recommend just building for the Destiny API endpoints as they are most well documented:

```
npm install
node builder.js DestinyService
```

This will create the files DestinyService.js, Docs-DestinyService.md and DestinyService.json,
you can delete the .md and .json file unless you want to look at the docs, and you'll be able to use the API Wrapper like this:

```js
var destiny = require('./DestinyService.js');
destiny["X-API-Key"] = "Your API Key Here";
```
---
If you want to use the all the services you can building them by running
```
node massbuild.js
```

Which will build all the Wrappers to './build/', in that directory you will also see a bungie.js file, which you can require in your script to have access to all the wrappers.

Keep in mind that you will need to supply an X-API-Key header to each Wrapper object, the same way as is done in the DestinyService Example.

---
<h2>Examples</h2>
Get Account Data:

```js
var destiny = require('./DestinyService.js');
destiny["X-API-Key"] = "APIKEY";

destiny.GetMembershipIdByDisplayName({
	membershipType: 2,
	displayName: 'NullRoz007'
}, (error, response, json) => {
	destiny.GetAccountSummary({
		membershipType: 2,
		destinyMembershipId: json.Response
	}, (error, response, acc) => {
		console.log(acc);
	});
});
```
