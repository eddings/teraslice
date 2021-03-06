'use strict';

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

const siteConfig = {
    title: 'Teraslice', // Title for your website.
    tagline: 'Scalable data processing pipelines in JavaScript',
    url: 'https://terascope.github.io', // Your website URL
    baseUrl: '/teraslice/', // Base URL for your project */
    // For github.io type URLs, you would set the url and baseUrl like:
    //   url: 'https://facebook.github.io',
    //   baseUrl: '/test-site/',

    // Used for publishing and more
    projectName: 'teraslice',
    organizationName: 'terascope',

    // For no header links in the top nav bar -> headerLinks: [],
    headerLinks: [
        { doc: 'overview', label: 'Docs' },
        { doc: 'asset-bundles', label: 'Assets' },
        { doc: 'packages', label: 'Packages' },
        { href: 'https://github.com/terascope/teraslice', label: 'GitHub' },
        { page: 'help', label: 'Help' }
    ],

    /* path to images for header/footer */
    headerIcon: 'img/logo.png',
    favicon: 'img/favicon.png',

    /* Colors for website */
    colors: {
        primaryColor: '#2D898B',
        secondaryColor: '#5FA9DD'
    },

    /* Custom fonts for website */
    /*
    fonts: {
        myFont: [
        "Times New Roman",
        "Serif"
        ],
        myOtherFont: [
        "-apple-system",
        "system-ui"
        ]
    },
    */

    // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
    copyright: `Copyright © ${new Date().getFullYear()} Terascope, LLC`,

    highlight: {
        // Highlight.js theme to use for syntax highlighting in code blocks.
        theme: 'github'
    },

    // Add custom scripts here that would be placed in <script> tags.
    scripts: [
        'https://buttons.github.io/buttons.js',
        'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js',
        '/teraslice/js/copy-code-block.js'
    ],
    stylesheets: ['/teraslice/css/copy-code-block.css', '/teraslice/css/custom.css'],

    // On page navigation for the current documentation page.
    onPageNav: 'separate',
    // No .html extensions for paths.
    cleanUrl: true,

    // Open Graph and Twitter card images.
    ogImage: 'img/docusaurus.png',
    twitterImage: 'img/docusaurus.png',

    // Show documentation's last contributor's name.
    // enableUpdateBy: true,

    // Show documentation's last update time.
    enableUpdateTime: true,

    algolia: {
        apiKey: 'b074b9b57bfd2e4d8b411aee052825d2',
        indexName: 'terascope_teraslice'
    },

    docsSideNavCollapsible: true

    // You may provide arbitrary config keys to be used as needed by your
    // template. For example, if you need your repo's URL...
    //   repoUrl: 'https://github.com/facebook/test-site',
};

module.exports = siteConfig;
