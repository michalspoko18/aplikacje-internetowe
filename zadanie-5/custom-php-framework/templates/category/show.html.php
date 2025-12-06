<?php
$title = 'Category: ' . htmlspecialchars($category->getName() ?? '');

ob_start(); ?>
    <h1>Category: <?= htmlspecialchars($category->getName() ?? '') ?></h1>

    <dl>
        <dt>ID</dt>
        <dd><?= (int)$category->getId() ?></dd>
        <dt>Name</dt>
        <dd><?= htmlspecialchars($category->getName() ?? '') ?></dd>
        <dt>Description</dt>
        <dd><?= nl2br(htmlspecialchars($category->getDescription() ?? '')) ?></dd>
    </dl>

    <p>
        <a href="<?= $router->generatePath('category-edit', ['id' => $category->getId()]) ?>">Edit</a>
        | <a href="<?= $router->generatePath('category-index') ?>">Back to list</a>
    </p>
<?php $main = ob_get_clean();

include __DIR__ . '/../base.html.php';
