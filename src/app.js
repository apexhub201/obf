// Start build
async function startBuild() {
    if (isBuilding) return;
    
    const source = editorInstance.getValue();
    if (!source.trim()) {
        showToast('Please enter Lua/Luau source code', 'error');
        return;
    }
    
    isBuilding = true;
    state.currentSource = source;
    state.resetStats();
    state.buildLog = [];
    
    document.getElementById('buildBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('buildLog').innerHTML = '<div class="log-entry">Starting build...</div>';
    
    try {
        const result = await buildWithWorker(source, state.settings, state.protectionToggles);
        
        if (result.success) {
            state.currentOutput = result.output;
            outputEditorInstance.setValue(result.output);
            
            // Update stats
            state.stats = { ...state.stats, ...result.stats };
            updateStats();
            
            // Update build log
            displayBuildLog(result.log);
            
            showToast('Build completed successfully', 'success');
            state.buildState = 'complete';
        } else {
            showToast('Build failed: ' + result.error, 'error');
            state.buildState = 'failed';
            
            // Display error in log
            displayBuildLog(result.log);
            displayBuildError(result.error);
        }
    } catch (error) {
        console.error('Build error:', error);
        showToast('Build failed: ' + error.message, 'error');
        state.buildState = 'failed';
        displayBuildLog([{ stage: 'ERROR', status: 'FAILED', message: error.message }]);
    } finally {
        isBuilding = false;
        document.getElementById('buildBtn').style.display = 'inline-block';
        document.getElementById('cancelBtn').style.display = 'none';
    }
}

// Build with worker
function buildWithWorker(source, settings, toggles) {
    return new Promise((resolve, reject) => {
        // Create a Worker from a separate file
        const worker = new Worker('src/worker.js');
        
        worker.onmessage = (e) => {
            clearTimeout(timeoutId);
            worker.terminate();
            resolve(e.data);
        };
        
        worker.onerror = (error) => {
            clearTimeout(timeoutId);
            worker.terminate();
            reject(error);
        };
        
        worker.postMessage({ source, settings, toggles });
        
        // Timeout after 30 seconds
        const timeoutId = setTimeout(() => {
            worker.terminate();
            reject(new Error('Build timeout'));
        }, 30000);
    });
}
