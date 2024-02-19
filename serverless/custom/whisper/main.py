
import whisperx
import os, sys
import subprocess
import json

def init_context(context):

    context.logger.info("Init context...100%")


def handler(context, event):
    context.logger.info("Run Transcription model")
    data = event.body
    # mime = data["mime"]


    path = data["video_path"]
    return json.dumps(transcribe(path))


def transcribe(path):

    device = os.environ.get('device', 'cpu')
    input_file = path
    filename, ext = os.path.splitext(input_file)
    batch_size = 1 # reduce if low on GPU mem
    compute_type = "int8" # change to "int8" if low on GPU mem (may reduce accuracy)

    extract_flag = 0

    if ext!='wav':
        extract_flag = 1
        subprocess.call(["ffmpeg", "-y", "-i", input_file, "-ac", "1", "-ar",
        "16000", f"{filename}.wav"], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        input_file = filename + '.wav'

    # 1. Transcribe with original whisper (batched)
    model = whisperx.load_model("large-v2", device, compute_type=compute_type)

    audio = whisperx.load_audio(input_file)
    result = model.transcribe(audio, batch_size=batch_size)
    print(result["segments"]) # before alignment

    # delete model if low on GPU resources
    # import gc; gc.collect(); torch.cuda.empty_cache(); del model

    # 2. Align whisper output
    model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=device)
    result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)

    #print(result["segments"]) # after alignment


    YOUR_HF_TOKEN=os.environ.get('HF_TOKEN', '')

    # 3. Assign speaker labels
    diarize_model = whisperx.DiarizationPipeline(use_auth_token=YOUR_HF_TOKEN, device=device)

    # add min/max number of speakers if known
    diarize_segments = diarize_model(audio)
    # diarize_model(audio, min_speakers=min_speakers, max_speakers=max_speakers)

    result = whisperx.assign_word_speakers(diarize_segments, result)
    #print(diarize_segments)
    #print(result["segments"]) # segments are now assigned speaker IDs

    for i in range(len(result["segments"])):
        result["segments"][i]["key"] = i

    return result



