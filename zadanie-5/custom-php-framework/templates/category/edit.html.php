<?php
$title = 'Edit Category #' . (int)$category->getId();
$bodyClass = 'edit';

ob_start(); ?>
	<h1>Edit Category #<?= (int)$category->getId() ?></h1>
	<?php require __DIR__ . '/_form.html.php'; ?>
<?php $main = ob_get_clean();

include __DIR__ . '/../base.html.php';
