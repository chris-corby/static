<?php   //  Page Variables

$page_url			=	'/';
$page_title  		=   'Home';
$page_description	=   'A starting point for static sites.';
$page_robots		=	false;

?>

<?php	//	Header
require_once 'snippets/header.php'; ?>

<main role="main">

	<article role="article">

		<header role="banner">
			<h1>Static</h1>
			<p>A starting point for static sites.</p>
		</header>

		<section>
			<?php	//	Fetch a snippet
			require_once 'snippets/snippet.php'; ?>
		</section>

	</article>

</main>

<?php	//	Header
require_once 'snippets/footer.php'; ?>
