
const enum Color {
	BLACK = 0,
	WHITE = 1,
	EMPTY = -1
};


class Vertex {
	stoneColor: Color;
	label: string;
	mark: string;
	style: string; // e.g. '#f00' for red color

	constructor() {
		this.clearVertex();
	}

	clearVertex() {
		this.stoneColor = Color.EMPTY;
		this.label = '';
		this.mark = '';
	}

	setStone(color:Color) {
		this.stoneColor = color;
	}

	setLabel(label:string) {
		this.label = label;
	}

	setMark(mark:string) {
		this.mark = mark;
	}

	setStyle(style:string) {
		this.style = style;
	}
}

export { Vertex, Color };
