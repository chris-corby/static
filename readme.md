# Static
A starting point for static sites.

##  To Start
1. Open the Terminal and navigate to the correct parent folder by running `cd PROJECT_PARENT_FOLDER`
1. Clone this repo by running `git clone https://github.com/chris-corby/static.git PROJECT_NAME`
1. Navigate into the new project and remove the remote by running `git remote rm origin` to keep it separate.
1. Update the `local_url` variable in package.json
1. Run `yarn install` to create the build setup
1. Run `yarn run sync` to start BrowserSync for PHP files.
1. Run `yarn run build` to compile both CSS and JS files for production.

## Useful Site Resources:
* [lazySizes](https://afarkas.github.io/lazysizes/)
* [Sanitize](https://github.com/jonathantneal/sanitize.css)

## Copyright and License
MIT
