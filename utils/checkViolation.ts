export function getViolations(list:any, sen:any) {
    for (const item of list) {
        const word = item.id;
        const severe = item.severity;
        if (severe>=2&&sen.includes(word)) {
            return {"tag":item.tag, "severity":item.severity, "id": item.id};
        }
    }
    return null;
}