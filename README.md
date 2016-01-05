# murderer.js

Node.js implementation of "Mörderspiel"

## What is this?

This is a hybrid game (real-life combined with online actions) that should last over a few days and is best played with ~15 to ~200 participants.

It can be played without any additional requisites (since all handy objects around are involved).

For more details, view a hosted instance of it: https://frissdiegurke.com/ the rules and hints are described within (in german only to-date).

## Installation (GNU/Linux)

    # install dependencies, installation varies depending on your OS
    sudo pacman -S nodejs npm mongodb git
    
    # clone repository
    git clone https://github.com/frissdiegurke/murderer.js.git
    cd murderer.js
    
    # install NPM dependencies
    npm install
    
    # edit legal information
    ## I am not a lawyer.
    $EDITOR public/static/views/legalInfo.html  # needs to be changed to provide your data instead of mine
    $EDITOR public/static/views/privacyPolicy.html  # needs to be changed to fit your local laws (e.g. translation into
                                                    # local language) and to provide your data instead of mine
    $EDITOR public/static/views/cookiePolicy.html  # needs to be changed to fit your local laws (e.g. translation into
                                                   #local language)
    
    # modify configuration
    grunt init  # this generates a unique secret for your server
    cp config/server.json config/server.local.json
    $EDITOR config/server.local.json  # modify attributes within "dist" as needed
    
    # compile public sources
    grunt
    
    # set environment variables
    ## email service
    export MURDERERJS_MAILER_HOST="YOUR_MAILING_HOST"
    export MURDERERJS_MAILER_USERNAME="YOUR_MAILING_USERNAME"
    export MURDERERJS_MAILER_PASSWORD="YOUR_MAILING_PASSWORD"
    export MURDERERJS_MAILER_EMAIL="YOUR_MAILING_EMAIL"
    
    # start server
    node .
