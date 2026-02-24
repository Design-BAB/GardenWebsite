package main

import (
	"bytes"
	_ "embed"
	"image/png"
	"math/rand/v2"

	rl "github.com/gen2brain/raylib-go/raylib"
)

const MaxFlowers = 100

// =====================
// EMBEDDED ASSETS
// =====================

//go:embed images/garden.png
var gardenPng []byte

//go:embed images/cow.png
var cowPng []byte

//go:embed images/cow-water.png
var cowWaterPng []byte

//go:embed images/flower.png
var flowerPng []byte

//go:embed images/flower-wilt.png
var flowerWiltPng []byte

//go:embed images/fangflower.png
var fangflowerPng []byte

func loadTexture(data []byte) rl.Texture2D {
	goImg, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		panic(err)
	}
	rlImg := rl.NewImageFromImage(goImg)
	tex := rl.LoadTextureFromImage(rlImg)
	rl.UnloadImage(rlImg)
	return tex
}

// =====================
// ACTOR
// =====================

type Actor struct {
	Texture rl.Texture2D
	rl.Rectangle
	Speed     float32
	WaterTime float32
}

func newActor(texture rl.Texture2D, x, y float32) *Actor {
	return &Actor{
		Texture: texture,
		Rectangle: rl.Rectangle{
			X:      x,
			Y:      y,
			Width:  float32(texture.Width),
			Height: float32(texture.Height),
		},
		Speed: 5,
	}
}

// =====================
// PLANT
// =====================

type Plant struct {
	Texture rl.Texture2D
	rl.Rectangle
	Vx, Vy  float32
	IsHappy bool
	IsEvil  bool
}

func newPlant(texture rl.Texture2D, x, y float32) *Plant {
	return &Plant{
		Texture: texture,
		Rectangle: rl.Rectangle{
			X:      x,
			Y:      y,
			Width:  float32(texture.Width) * 1.6,
			Height: float32(texture.Height),
		},
		IsHappy: true,
	}
}

// =====================
// GAME
// =====================

type Game struct {
	Width, Height    int32
	CenterX, CenterY int32

	ShowMenu      bool
	IsOver        bool
	IsGardenHappy bool

	TimeSpawn   float32
	TimeWilt    float32
	TimeMutate  float32
	TimeUnhappy float32

	Cow     *Actor
	Flowers []*Plant

	Textures struct {
		Cow    map[string]rl.Texture2D
		Flower map[string]rl.Texture2D
		Bg     rl.Texture2D
	}
}

func NewGame() *Game {
	return &Game{
		Width:         800,
		Height:        600,
		CenterX:       400,
		CenterY:       300,
		ShowMenu:      true,
		IsGardenHappy: true,
	}
}

// =====================
// GAME LOGIC
// =====================

func (g *Game) SpawnFlower() {
	if len(g.Flowers) >= MaxFlowers {
		return
	}

	x := float32(rand.IntN(int(g.Width-100)) + 50)
	y := float32(rand.IntN(int(g.Height-250)) + 150)

	flower := newPlant(g.Textures.Flower["normal"], x, y)
	g.Flowers = append(g.Flowers, flower)
}

func (g *Game) WiltFlower() {
	if len(g.Flowers) == 0 {
		return
	}

	for attempts := 0; attempts < 5; attempts++ {
		pick := rand.IntN(len(g.Flowers))
		f := g.Flowers[pick]

		if f.IsHappy && !f.IsEvil {
			f.IsHappy = false
			f.Texture = g.Textures.Flower["dry"]
			return
		}
	}
}

func (g *Game) MutateFlower() {
	if len(g.Flowers) == 0 {
		return
	}

	pick := rand.IntN(len(g.Flowers))
	f := g.Flowers[pick]

	if !f.IsEvil {
		f.IsEvil = true
		f.IsHappy = true
		f.Texture = g.Textures.Flower["evil"]

		speed := float32(rand.IntN(2) + 2)
		if rand.IntN(2) == 0 {
			speed *= -1
		}

		f.Vx = speed
		f.Vy = speed
	}
}

func (g *Game) UpdateEvilFlowers(delta float32) {
	for _, f := range g.Flowers {
		if !f.IsEvil {
			continue
		}

		nextX := f.X + (f.Vx * delta * 60)
		nextY := f.Y + (f.Vy * delta * 60)

		hitLeftLine := getBoundsAt(nextX, nextY) <= 10
		hitRightLine := getBoundsRightSideAt(nextX, nextY) <= 10
		if hitLeftLine || hitRightLine {
			f.Vx *= -1
			nextX = f.X + (f.Vx * delta * 60)
		}

		if nextY < 150 || nextY > float32(g.Height) {
			f.Vy *= -1
			nextY = f.Y + (f.Vy * delta * 60)
		}

		f.X = nextX
		f.Y = nextY
	}
}

func getBoundsAt(x, y float32) float32 {
	where := x * 232
	howHigh := y * 120
	return where + howHigh - 49560
}

func getBoundsRightSideAt(x, y float32) float32 {
	where := x * -238
	howHigh := y * 115
	return where + howHigh + 142330
}

func (g *Game) CheckCollisions() {
	for _, f := range g.Flowers {
		if f.IsEvil && rl.CheckCollisionRecs(g.Cow.Rectangle, f.Rectangle) {
			g.IsOver = true
		}
	}
}

func (g *Game) CheckGardenState(delta float32) {
	unhappy := 0

	for _, f := range g.Flowers {
		if !f.IsHappy {
			unhappy++
		}
	}

	if unhappy == 0 {
		g.IsGardenHappy = true
		g.TimeUnhappy = 0
		return
	}

	g.IsGardenHappy = false
	g.TimeUnhappy += delta

	if g.TimeUnhappy >= 10 {
		g.IsOver = true
	}
}

func (g *Game) HandleInput() {
	if g.ShowMenu {
		if rl.IsKeyPressed(rl.KeyX) {
			g.ShowMenu = false
		}
		return
	}

	if g.IsOver {
		return
	}

	if rl.IsKeyDown(rl.KeyRight) {
		g.Cow.X += g.Cow.Speed
	}
	if rl.IsKeyDown(rl.KeyLeft) {
		g.Cow.X -= g.Cow.Speed
	}
	if rl.IsKeyDown(rl.KeyUp) {
		g.Cow.Y -= g.Cow.Speed
	}
	if rl.IsKeyDown(rl.KeyDown) {
		g.Cow.Y += g.Cow.Speed
	}

	if rl.IsKeyDown(rl.KeySpace) {
		g.Cow.Texture = g.Textures.Cow["watering"]
		g.Cow.WaterTime = 0

		for _, flower := range g.Flowers {
			if rl.CheckCollisionRecs(g.Cow.Rectangle, flower.Rectangle) {
				flower.IsHappy = true
				if !flower.IsEvil {
					flower.Texture = g.Textures.Flower["normal"]
				}
			}
		}
	}
}

func (g *Game) UpdateGame() {
	if g.ShowMenu || g.IsOver {
		return
	}

	delta := rl.GetFrameTime()

	g.TimeSpawn += delta
	g.TimeWilt += delta
	g.TimeMutate += delta
	g.Cow.WaterTime += delta

	if g.Cow.Texture.ID == g.Textures.Cow["watering"].ID && g.Cow.WaterTime >= 0.35 {
		g.Cow.Texture = g.Textures.Cow["normal"]
	}

	if g.TimeSpawn >= 4 {
		g.SpawnFlower()
		g.TimeSpawn = 0
	}

	if g.TimeWilt >= 3 {
		g.WiltFlower()
		g.TimeWilt = 0
	}

	if g.TimeMutate >= 20 {
		g.MutateFlower()
		g.TimeMutate = 0
	}

	g.UpdateEvilFlowers(delta)
	g.CheckCollisions()
	g.CheckGardenState(delta)
}

func (g *Game) Draw() {
	rl.BeginDrawing()
	rl.ClearBackground(rl.RayWhite)
	rl.DrawTexture(g.Textures.Bg, 0, 0, rl.White)

	if g.ShowMenu {
		title := "Welcome to Happy Garden!"
		w := rl.MeasureText(title, 60)
		rl.DrawText(title, g.CenterX-(w/2), 200, 60, rl.Black)

		start := "Press X to Start"
		w2 := rl.MeasureText(start, 30)
		rl.DrawText(start, g.CenterX-(w2/2), 400, 30, rl.DarkGray)

		rl.EndDrawing()
		return
	}

	if !g.IsOver {
		for _, f := range g.Flowers {
			if f.Y < g.Cow.Y+35 {
				rl.DrawTexture(f.Texture, int32(f.X), int32(f.Y), rl.White)
			}
		}
		rl.DrawTexture(g.Cow.Texture, int32(g.Cow.X), int32(g.Cow.Y), rl.White)
		for _, f := range g.Flowers {
			if f.Y >= g.Cow.Y+35 {
				rl.DrawTexture(f.Texture, int32(f.X), int32(f.Y), rl.White)
			}
		}
	} else {
		msg := "GARDEN LOST!"
		w := rl.MeasureText(msg, 40)
		rl.DrawText(msg, g.CenterX-(w/2), g.CenterY, 40, rl.Red)
	}

	rl.EndDrawing()
}

// =====================
// MAIN
// =====================

func main() {
	game := NewGame()

	rl.InitWindow(game.Width, game.Height, "Happy Garden")
	defer rl.CloseWindow()
	rl.SetTargetFPS(60)

	game.Textures.Bg = loadTexture(gardenPng)

	game.Textures.Cow = map[string]rl.Texture2D{
		"normal":   loadTexture(cowPng),
		"watering": loadTexture(cowWaterPng),
	}

	game.Textures.Flower = map[string]rl.Texture2D{
		"normal": loadTexture(flowerPng),
		"dry":    loadTexture(flowerWiltPng),
		"evil":   loadTexture(fangflowerPng),
	}

	game.Cow = newActor(game.Textures.Cow["normal"], 100, 500)

	update := func() {
		game.HandleInput()
		game.UpdateGame()
		game.Draw()
	}

	rl.SetMainLoop(update)

	for !rl.WindowShouldClose() {
		update()
	}
}
