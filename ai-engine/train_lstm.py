"""Optional LSTM training seam. Generate only synthetic prototype data; never label its results as field observations."""
import numpy as np
try:
    from tensorflow import keras
except ImportError as error:
    raise SystemExit("Install tensorflow on a supported platform to train the optional LSTM.") from error
rng=np.random.default_rng(42); X=rng.uniform(0,1,(600,24,5)); y=(X[:,-1,0]*.55+X[:,-1,1]*.2+X[:,-1,3]*.25)
model=keras.Sequential([keras.layers.Input((24,5)),keras.layers.LSTM(64),keras.layers.Dense(1)]);model.compile('adam','mse');model.fit(X,y,epochs=20,validation_split=.2);model.save('prototype_lstm.keras')
