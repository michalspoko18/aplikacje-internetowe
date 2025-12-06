<?php
$title = 'Create Category';
$bodyClass = 'edit';

ob_start(); ?>
	<h1>Create Category</h1>
	<?php require __DIR__ . '/_form.html.php'; ?>
<?php $main = ob_get_clean();

include __DIR__ . '/../base.html.php';
