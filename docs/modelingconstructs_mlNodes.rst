ML Elements
-----------

ML Elements provide machine learning and quantum machine learning nodes that integrate with the QHAna Plugin Runner for execution.

The following quantum ML nodes are supported:

- **Quantum Clustering**: Clusters data using the quantum k-means algorithm.

- **qnn**: Classifies data with a quantum neural network.

- **quantum-cnn**: Labels data with a quantum convolutional neural network.

- **quantum-k-nearest-neighbours**: Quantum k-nearest neighbours classification.

- **quantum-parzen-window**: Quantum parzen window classification.

- **quantum-kernel-estimation**: Produces a kernel matrix from a quantum kernel.

- **vqc**: Variational Quantum Classifier.

- **hybrid-autoencoder**: Reduces dimensionality with classical and quantum neural networks.

The following classical ML nodes are supported:

- **Classical Clustering**: Clusters data with the classical k-means algorithm.

- **classical-k-medoids**: Clusters data with the classical k-medoids algorithm.

- **optics**: Clusters data with the OPTICS algorithm.

- **svm**: Classifies data with a support vector machine.

- **neural-network**: Neural network objective-function plugin.

ML nodes use classical data types for input such as **file** (URL or file path to data) and **Number** (numeric parameters).
