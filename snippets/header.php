<?php //  Site Settings
require_once 'snippets/site.php'; ?>

<!DOCTYPE html>
<html lang="<?= $site_lang; ?>" class="no-js" itemscope itemtype="http://schema.org/WebSite">
  <head>
    <?php //  Switch 'no-js' with 'js' on <html> if scripts are allowed
          //  http://www.paulirish.com/2009/avoiding-the-fouc-v3/ ?>
    <script>(function(H){H.className=H.className.replace(/\bno-js\b/,'js')})(document.documentElement)</script>

    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

    <title><?= $page_title . ' — ' . $site_title; ?></title>
		<?php if ($page_description): ?>
			<meta name="description" content="<?= $page_description; ?>" itemprop="about">
		<?php endif; ?>

    <?php //  Canonical ?>
    <link rel="canonical" href="<?= $site_url . $page_url; ?>" itemprop="url">
		
    <?php //  Prefetch ?>

    <?php //  Fonts
          //  If fonts already cached, load straight away
          //  Allows FOUT over FOIT
          //  https://fontfaceobserver.com/
    ?>
    <script>
      //  Font
      if (sessionStorage.fontLoaded) {
        var html = document.documentElement;
            html.classList.add('font-loaded');
        }
    </script>

    <?php //  CSS
  				//	Use filemtime for cachebusting
  				//	http://php.net/manual/en/function.filemtime.php ?>
    <link rel="stylesheet" href="assets/css/build/style.css?ver=<?= filemtime('assets/css/build/style.css'); ?>">

    <?php //  Misc Schema ?>
    <meta itemprop="name" content="<?= $site_title; ?>">

    <?php //  Favicons
  				//	https://realfavicongenerator.net/ ?>
    <link rel="apple-touch-icon" sizes="180x180" href="assets/img/favicons/apple-touch-icon.png">
    <link rel="icon" type="image/png" href="assets/img/favicons/favicon-32x32.png" sizes="32x32">
    <link rel="icon" type="image/png" href="assets/img/favicons/favicon-16x16.png" sizes="16x16">
    <link rel="manifest" href="assets/img/favicons/manifest.json">
    <link rel="mask-icon" href="assets/img/favicons/safari-pinned-tab.svg" color="#ffffff">
    <meta name="theme-color" content="#ffffff">

    <?php //  OG ?>
    <meta property="og:locale" content="<?= str_replace('-', '_', $site_lang); ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= $page_title; ?>">
    <meta property="og:description" content="<?= $page_description; ?>" />
    <meta property="og:url" content="<?= $site_url; ?>">
    <meta property="og:image" content="assets/img/favicons/apple-touch-icon.png">
    <meta property="og:site_name" content="<?= $site_title; ?>">

    <?php //  Twitter ?>
    <meta name="twitter:card" content="summary">
    <meta name="twitter:description" content="<?= $page_description; ?>" />
    <meta name="twitter:title" content="<?= $page_title; ?>">
    <meta name="twitter:image" content="assets/img/favicons/apple-touch-icon.png">
		<?php if ($site_twitter_user): ?>
			<meta name="twitter:site" content="<?= $site_twitter_user; ?>">
			<meta name="twitter:creator" content="<?= $site_twitter_user; ?>">
		<?php endif; ?>
		
    <?php //  Robots ?>
		<?php if ($page_robots): ?>
			<meta name="robots" content="<?= $page_robots; ?>">
		<?php endif; ?>

  </head>
	
	<body>

    <?php   //  Browse Happy ?>
    <!--[if IE]>
      <div class="browse-happy">
        To experience this site as it was intended, please <a href="http://browsehappy.com/" target="_blank">upgrade your browser</a>.
      </div>
    <![endif]-->
    