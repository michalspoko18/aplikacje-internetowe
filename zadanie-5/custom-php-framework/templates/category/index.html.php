<?php
$title = 'Categories';

ob_start(); ?>
    <h1>Categories</h1>
    <p>
        <a href="<?= $router->generatePath('category-create') ?>">Create category</a>
        | <a href="<?= $router->generatePath('post-index') ?>">Posts</a>
    </p>

    <table border="1" cellpadding="6">
        <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($categories as $category): ?>
            <tr>
                <td><?= (int)$category->getId() ?></td>
                <td><?= htmlspecialchars($category->getName() ?? '') ?></td>
                <td><?= htmlspecialchars($category->getDescription() ?? '') ?></td>
                <td>
                    <a href="<?= $router->generatePath('category-show', ['id' => $category->getId()]) ?>">show</a>
                    <a href="<?= $router->generatePath('category-edit', ['id' => $category->getId()]) ?>">edit</a>
                    <a href="<?= $router->generatePath('category-delete', ['id' => $category->getId()]) ?>" onclick="return confirm('Delete this category?')">delete</a>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php $main = ob_get_clean();

include __DIR__ . '/../base.html.php';
