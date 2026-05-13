ML Elements
===========

ML Elements provide building blocks for creating machine learning (ML) and
quantum machine learning (QML) workflows. These elements are translated into
executable workflows using QHAna plugins.

ML nodes operate on standard input types such as:

- **File**: A dataset provided via URL or local file path
- **Number**: Numeric parameters (e.g., number of clusters, neighbors, epochs)


Quantum Machine Learning Nodes
=============================

Quantum Clustering
------------------
Performs clustering using quantum-enhanced algorithms.

Supported methods:

- k-means
- k-median


Quantum Neural Network (QNN)
---------------------------
Classifies data using a quantum neural network.


Quantum CNN
-----------
Applies a quantum convolutional neural network (QCNN) to label data.


Quantum k-Nearest Neighbours (QkNN)
----------------------------------
Classifies data based on proximity using a quantum version of the
k-nearest neighbors algorithm.


Quantum Parzen Window
---------------------
Performs classification using a quantum-enhanced Parzen window approach.


Quantum Kernel Estimator
------------------------
Generates a kernel matrix using a quantum kernel. The resulting matrix
can be used as input for other algorithms such as support vector machines.


Variational Quantum Classifier (VQC)
-----------------------------------
A hybrid quantum-classical classifier that uses parameterized quantum
circuits for supervised learning tasks.


Hybrid Autoencoder
------------------
Reduces data dimensionality using a combination of classical and quantum
neural network components.


Classical Machine Learning Nodes
===============================

Classical Clustering
--------------------
Clusters data using standard algorithms.

Supported methods:

- k-means
- k-medoids
- k-median
- OPTICS


Support Vector Machine (SVM)
----------------------------
Classifies data using a support vector machine.


Neural Network
--------------
A classical neural network for general-purpose learning tasks such as
classification and regression.