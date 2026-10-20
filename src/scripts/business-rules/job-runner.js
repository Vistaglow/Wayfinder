(function executeRule(current, previous /*null when async*/) {
    var jobId = current.getUniqueValue();
    try {
        new x_snc_wayfinder_ai.WayfinderAgent().runJob(jobId);
    } catch (e) {
        gs.error('[Wayfinder] job runner crashed for ' + jobId + ': ' + (e && e.message ? e.message : e));
        var job = new GlideRecord('x_snc_wayfinder_ai_chat_job');
        if (job.get(jobId)) {
            job.setValue('status', 'error');
            job.setValue('error_message', String(e && e.message ? e.message : e).substring(0, 1000));
            job.update();
        }
    }
})(current, previous);
