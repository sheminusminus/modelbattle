# experiments

## setup

```
git clone https://github.com/sheminusminus/shawwn-experiments
cd shawwn-experiments
yarn
```

## configurations & requirements

### firebase config

replace the values in `src/firebaseConfig.js` with those for your own firebase project.

### firebase auth

to run the app with the auth providers currently used, enable the following sign-in methods in your project's Authentication tab (https://console.firebase.google.com/project/YOUR_PROJECT_NAME/authentication/providers):

- google
- github (and follow the [setup instructions](https://firebase.google.com/docs/auth/web/github-auth))
- anonymous

### firebase storage structure

**you will need two directories per experiment, each containing a full set of images.**

for any given experiment, each image set must be contained in a single top-level directory in firebase storage. these directories, as well as the images they contain, can have any names you'd like.

> note: directories may not be nested.

### firebase realtime database structure

required setup example:

```
"meta": {
  "example_experiment_name" : {
    "a_dir" : "imageSetA_dirName",
    "b_dir" : "imageSetB_dirName"
  },
  "ffhq_512_run00Gs_vs_run03Gs" : {
    "a_dir" : "run00_ffhq_512_Gs_1x1",
    "b_dir" : "run03_ffhq_512_Gs_1x1"
  }
}
```

in your firebase realtime database, add a top-level key `meta`.

under the `meta` key, add the name of your experiment as a key.

the following keys should be nested under your experiment name:

- `a_dir: [string]` the name of the directory in firebase storage where image set A is found

- `b_dir: [string]` the name of the directory in firebase storage where image set B is found

you can add as many experiments as you'd like, as long as each follow this structure.

### experiment urls

if you're running this app at domain e.g. `my-ab-test.com`, the a/b test for an experiment can be found at `my-ab-test.com/exp?n=EXPERIMENT_NAME`, provided the metadata for `EXPERIMENT_NAME` exists in your firebase database.

## scripts

in the project directory, you can run:

### `yarn start`

runs the app in the development mode.<br />
open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `yarn build`

builds the app for production to the `build` folder.

### `yarn eject`

this was bootstrapped with create-react-app. ejection hasn't yet been necessary, but the option is of course there.

## using this code

please do! just credit me in your code comments :)
