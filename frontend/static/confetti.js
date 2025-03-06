import os
from flask import Flask

app = Flask(__name__, static_folder="frontend")

import Confetti from '/react-dom-confetti-master/src/confetti.js';