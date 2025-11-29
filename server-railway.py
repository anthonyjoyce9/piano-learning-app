#!/usr/bin/env python3
"""
Production server for Railway.app deployment
Uses Basic Pitch (Spotify) for accurate transcription
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os

app = Flask(__name__)
CORS(app)  # Allow requests from your web app

# Try to import Basic Pitch (will work on Railway.app)
try:
    from basic_pitch.inference import predict
    from basic_pitch import ICASSP_2022_MODEL_PATH
    BASIC_PITCH_AVAILABLE = True
    print("✓ Basic Pitch loaded successfully!")
except ImportError:
    BASIC_PITCH_AVAILABLE = False
    print("⚠ Basic Pitch not available (install with: pip install basic-pitch)")

@app.route('/convert', methods=['POST'])
def convert_audio_to_midi():
    try:
        # Check if Basic Pitch is available
        if not BASIC_PITCH_AVAILABLE:
            return jsonify({
                'error': 'Basic Pitch not installed',
                'message': 'Deploy to Railway.app for full conversion support'
            }), 503
        
        # Get uploaded audio file
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name
        
        print(f"Converting file: {audio_file.filename}")
        
        # Convert using Basic Pitch
        model_output, midi_data, note_events = predict(temp_path)
        
        # Convert to JSON format
        notes = []
        for note in note_events:
            notes.append({
                'note': midi_to_note_name(int(note['pitch'])),
                'start': float(note['start_time_s']),
                'duration': float(note['duration_s']),
                'velocity': int(note['amplitude'] * 127)
            })
        
        # Clean up
        os.unlink(temp_path)
        
        print(f"✓ Converted {len(notes)} notes")
        
        # Return JSON
        return jsonify({
            'tempo': 120,
            'timeSignature': [4, 4],
            'events': notes,
            'syncOffsetMs': 0
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'running',
        'basic_pitch': BASIC_PITCH_AVAILABLE,
        'message': 'Server is running!'
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'name': 'Piano Learning App - Conversion Server',
        'version': '1.0.0',
        'basic_pitch': BASIC_PITCH_AVAILABLE,
        'endpoints': {
            '/convert': 'POST - Convert audio to MIDI',
            '/health': 'GET - Health check'
        }
    })

def midi_to_note_name(midi_number):
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    octave = (midi_number // 12) - 1
    note = notes[midi_number % 12]
    return f"{note}{octave}"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🎹 Piano Learning App - Conversion Server")
    if BASIC_PITCH_AVAILABLE:
        print("✓ Basic Pitch AI ready!")
    else:
        print("⚠ Basic Pitch not available")
    print(f"🌐 Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
