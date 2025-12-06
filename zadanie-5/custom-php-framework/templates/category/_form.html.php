<form method="post" action="<?= isset($category) && $category->getId() ? $router->generatePath('category-edit', ['id' => $category->getId()]) : $router->generatePath('category-create') ?>">
    <div>
        <label for="name">Name</label>
        <input id="name" name="category[name]" value="<?= htmlspecialchars($category->getName() ?? '') ?>" />
    </div>
    <div>
        <label for="description">Description</label>
        <textarea id="description" name="category[description]"><?= htmlspecialchars($category->getDescription() ?? '') ?></textarea>
    </div>
    <div>
        <button type="submit">Save</button>
        <a href="<?= $router->generatePath('category-index') ?>">Back to list</a>
    </div>
</form>
