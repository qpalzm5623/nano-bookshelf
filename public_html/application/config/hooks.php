<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| Hooks
| -------------------------------------------------------------------------
| This file lets you define "hooks" to extend CI without hacking the core
| files.  Please see the user guide for info:
|
|	https://codeigniter.com/user_guide/general/hooks.html
|
*/
$hook['post_controller_constructor'] = function()
{
    /**
     * Localisation Strings Windows:
     * @link https://msdn.microsoft.com/en-us/library/cdax410z(v=vs.90).aspx
     * @link https://msdn.microsoft.com/en-us/library/39cwe7zf(v=vs.90).aspx
     * Localisation Strings Unix:
     * Verify that the selected locales are available by running `locale -a`.
     *
     * in addition take a look at
     * @link http://avenir.ro/create-cms-using-codeigniter-3/create-multilanguage-site-codeigniter/
     **/

    $locale = Array(
        "de" => Array(
            'de_DE.UTF-8',
            'de_DE@euro',
            'de_DE',
            'german',
            'ger',
            'deu',
            'de'
        ),
        "en" => Array(
            "en_US",
            "en_GB.UTF-8",
            "en_GB@euro",
            "en_GB",
            "english",
            "eng",
            "gbr",
            "en"
        )
    );

    $CI = &get_instance();
    $lang = $this->uri->segment(1);
    if(isset($locale[$lang])){
        $getTextConfig = Array(
            'gettext_catalog_codeset' => 'UTF8',
            'gettext_text_domain' => 'example',
            'gettext_locale_dir' => './language/locales/';
            'gettext_locale' => $locale[$lang]
        );
        $CI->load->library('gettext', $getTextConfig);
    }
    else {
        $CI->load->library('gettext');
    }

};
