"""Quick visual look at the Iris dataset this project's model is trained on."""

import matplotlib.pyplot as plt
from sklearn.datasets import load_iris

iris = load_iris()
colors = ["#e74c3c", "#3498db", "#2ecc71"]  # setosa, versicolor, virginica

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Petal length vs width — the two features that separate species most cleanly
ax = axes[0]
for i, name in enumerate(iris.target_names):
    mask = iris.target == i
    ax.scatter(
        iris.data[mask, 2], iris.data[mask, 3],
        c=colors[i], label=name, alpha=0.7, edgecolors="k", s=50,
    )
ax.set_xlabel("Petal length (cm)")
ax.set_ylabel("Petal width (cm)")
ax.set_title("Petal measurements by species")
ax.legend()

# Sepal length vs width — the two features that overlap more
ax = axes[1]
for i, name in enumerate(iris.target_names):
    mask = iris.target == i
    ax.scatter(
        iris.data[mask, 0], iris.data[mask, 1],
        c=colors[i], label=name, alpha=0.7, edgecolors="k", s=50,
    )
ax.set_xlabel("Sepal length (cm)")
ax.set_ylabel("Sepal width (cm)")
ax.set_title("Sepal measurements by species")
ax.legend()

plt.tight_layout()
plt.savefig("iris_scatter.png", dpi=150)
print("Saved iris_scatter.png")
