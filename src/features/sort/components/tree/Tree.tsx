import { ICON } from "../../constants/icons";
import type { SortTreeNode } from "../../../../types/sort";

export type TreeProps = {
    nodes: SortTreeNode[];
    depth?: number;
};

const ChevronRight = ICON.chevronRight;

export function Tree({ nodes, depth = 0 }: TreeProps) {
    const className = depth === 0 ? "font-mono text-caption space-y-0.5" : "ml-4 space-y-0.5";

    return (
        <ul className={className}>
            {nodes.map((node, index) => (
                <li key={`${depth}-${index}-${node.label}`}>
                    <div
                        className={`flex items-center gap-2 py-0.5 ${
                            node.muted ? "text-fg-3" : ""
                        }`}
                    >
                        {node.kind === "folder" ? (
                            <ChevronRight className="h-3 w-3 text-fg-3" aria-hidden />
                        ) : (
                            <span className="text-fg-3" aria-hidden>
                                {"·"}
                            </span>
                        )}
                        <span className={node.muted ? "text-fg-3" : "text-fg-1"}>{node.label}</span>
                    </div>
                    {node.kind === "folder" && node.children.length > 0 && (
                        <Tree nodes={node.children} depth={depth + 1} />
                    )}
                </li>
            ))}
        </ul>
    );
}
