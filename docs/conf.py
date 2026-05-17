import os
import sys

# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

# set system path to /leqo-backend/
sys.path.insert(0, os.path.abspath("../"))

project = "Quantum Low-Code Tool"
copyright = "2025, Sharon-Naemi Stiliadou"
author = "Sharon-Naemi Stiliadou"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "sphinx.ext.duration",
    "sphinx.ext.doctest",
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.intersphinx",
    "sphinxcontrib.openapi",
    "sphinxcontrib.datatemplates"
]

# https://sphinx-autoapi.readthedocs.io/en/latest/reference/config.html
autoapi_options = [
    "members",
]
autoapi_dirs = ["../app"]
autodoc_typehints = "both"

intersphinx_mapping = {
    "python": ("https://docs.python.org/3/", None),
    "sphinx": ("https://www.sphinx-doc.org/en/master/", None),
    "fastapi": ("https://fastapi.tiangolo.com/", None),
    "pydantic": ("https://docs.pydantic.dev/latest/", None),
}

intersphinx_disabled_domains = ["std"]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
