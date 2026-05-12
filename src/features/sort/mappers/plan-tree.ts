import type { SortPlan, SortPlanItem } from "../../../types/ipc";
import type { SortTreeNode } from "../../../types/sort";

const PATH_SEPARATORS = /[\\/]+/;
const FILES_SUFFIX = "files";
const FILE_SUFFIX = "file";

export function planToTree(plan: SortPlan): SortTreeNode[] {
    const root = collectFolderCounts(plan);

    return toTreeNodes(root);
}

type FolderNode = {
    files: number;
    children: Map<string, FolderNode>;
};

function collectFolderCounts(plan: SortPlan): FolderNode {
    const root = emptyNode();

    for (const item of plan.items) {
        const segments = folderSegments(plan.root, item);
        insertSegments(root, segments);
    }

    return root;
}

function folderSegments(root: string, item: SortPlanItem): string[] {
    const targetSegments = splitPath(item.target);
    const rootSegments = splitPath(root);
    const relative = stripPrefix(targetSegments, rootSegments);

    if (relative.length <= 1) {
        return [];
    }

    return relative.slice(0, -1);
}

function splitPath(path: string): string[] {
    return path.split(PATH_SEPARATORS).filter((segment) => segment.length > 0);
}

function stripPrefix(segments: string[], prefix: string[]): string[] {
    for (let i = 0; i < prefix.length; i += 1) {
        if (segments[i] !== prefix[i]) {
            return segments;
        }
    }

    return segments.slice(prefix.length);
}

function insertSegments(root: FolderNode, segments: string[]): void {
    if (segments.length === 0) {
        root.files += 1;
        return;
    }

    let cursor = root;

    for (const segment of segments) {
        let next = cursor.children.get(segment);

        if (next === undefined) {
            next = emptyNode();
            cursor.children.set(segment, next);
        }

        cursor = next;
    }

    cursor.files += 1;
}

function toTreeNodes(node: FolderNode): SortTreeNode[] {
    const nodes: SortTreeNode[] = [];

    for (const [label, child] of sortedEntries(node.children)) {
        nodes.push(buildFolderNode(label, child));
    }

    if (node.files > 0) {
        nodes.push(buildFileSummary(node.files));
    }

    return nodes;
}

function buildFolderNode(label: string, child: FolderNode): SortTreeNode {
    return {
        kind: "folder",
        label,
        children: toTreeNodes(child),
    };
}

function buildFileSummary(count: number): SortTreeNode {
    return {
        kind: "file",
        label: `${count.toLocaleString()} ${count === 1 ? FILE_SUFFIX : FILES_SUFFIX}`,
    };
}

function sortedEntries(map: Map<string, FolderNode>): [string, FolderNode][] {
    return Array.from(map.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function emptyNode(): FolderNode {
    return { files: 0, children: new Map() };
}
